/**
 * API route for MCP agent proxy
 * Handles communication between frontend and MCP server
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from 'src/server/mcp/logger';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL! || 'http://localhost:3001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      message, 
      context, 
      sessionId,
      action,
      model = 'gpt-4'
    } = req.body;

    // Get OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key is missing' });
    }

    // Step 1: Process context through MCP server
    let enrichedContext;
    let currentSessionId = sessionId;
    
    if (context) {
      try {
        const mcpResponse = await fetch(`${MCP_SERVER_URL}/api/mcp/process-context`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...context,
            sessionId: sessionId || 'default'
          }),
        });

        if (!mcpResponse.ok) {
          logger.warn('Failed to process context through MCP server:', {
            status: mcpResponse.status,
            statusText: mcpResponse.statusText
          });
          
          // Continue without enriched context
          enrichedContext = null;
        } else {
          const mcpData = await mcpResponse.json();
          enrichedContext = mcpData.context;
          currentSessionId = mcpData.sessionId;
        }
      } catch (error) {
        logger.error('Error communicating with MCP server:', error);
        // Continue without enriched context
        enrichedContext = null;
      }
    }

    // Step 2: If there's an action to execute, do it through MCP
    let actionResult;
    if (action) {
      try {
        const actionResponse = await fetch(`${MCP_SERVER_URL}/api/mcp/execute-action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            action: action.type,
            parameters: action.payload
          }),
        });

        if (!actionResponse.ok) {
          logger.warn('Failed to execute action through MCP server:', {
            status: actionResponse.status,
            statusText: actionResponse.statusText
          });
          
          actionResult = { 
            success: false, 
            error: `Failed to execute action: ${actionResponse.statusText}`
          };
        } else {
          actionResult = await actionResponse.json();
        }
      } catch (error) {
        logger.error('Error executing action through MCP server:', error);
        actionResult = { 
          success: false, 
          error: `Error executing action: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
      
      // Return action result if this is an action-only request
      if (!message) {
        return res.status(200).json({
          success: true,
          action: {
            type: action.type,
            result: actionResult
          },
          sessionId: currentSessionId
        });
      }
    }

    // Step 3: Now call OpenAI with the enriched context
    // Get available actions from MCP server
    let availableActions = [];
    try {
      const actionsResponse = await fetch(`${MCP_SERVER_URL}/api/mcp/available-actions`, {
        method: 'GET'
      });

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        availableActions = actionsData.actions;
      }
    } catch (error) {
      logger.warn('Failed to get available actions:', error);
    }

    // Prepare messages for OpenAI
    const messages = [];
    
    // System message with context
    let systemMessage = 'You are a helpful CAD/CAM assistant for the CAD/CAM FUN application. ';
    
    if (enrichedContext) {
      systemMessage += `\n\nCurrent application context:\n${JSON.stringify(enrichedContext, null, 2)}`;
    }
    
    if (actionResult) {
      systemMessage += `\n\nAction execution result:\n${JSON.stringify(actionResult, null, 2)}`;
    }
    
    messages.push({
      role: 'system',
      content: systemMessage
    });
    
    // Add the user message
    messages.push({
      role: 'user',
      content: message
    });

    // Prepare tools for OpenAI
    const tools = availableActions.map((action: { name: any; description: any; parameters: any[]; }) => ({
      type: 'function',
      function: {
        name: action.name,
        description: action.description,
        parameters: {
          type: 'object',
          properties: action.parameters.reduce((acc, param) => {
            acc[param.name] = {
              type: param.type,
              description: param.description
            };
            
            // Add enum if available
            if (param.enum) {
              acc[param.name].enum = param.enum;
            }
            
            return acc;
          }, {}),
          required: action.parameters
            .filter(param => param.required)
            .map(param => param.name)
        }
      }
    }));

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      return res.status(openaiResponse.status).json({
        success: false,
        error: errorData.error.message || 'OpenAI API error',
        details: errorData
      });
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices[0].message;

    // Check if the assistant wants to use a tool
    const responseData: any = {
      success: true,
      sessionId: currentSessionId,
      content: assistantMessage.content || '',
    };

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      
      if (toolCall.type === 'function') {
        try {
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          responseData.action = {
            type: toolCall.function.name,
            payload: functionArgs,
            description: `Executing ${toolCall.function.name}`
          };
        } catch (e) {
          logger.error('Error parsing tool call arguments:', e);
        }
      }
    }

    return res.status(200).json(responseData);
  } catch (error) {
    logger.error('MCP agent proxy error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}