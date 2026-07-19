import { NextRequest, NextResponse } from 'next/server';
import * as workflowRoute from '@/api/routes/workflow/route';
import * as triggerRoute from '@/api/routes/workflow/triggers/route';
import * as actionRoute from '@/api/routes/workflow/actions/route';
import * as executionRoute from '@/api/routes/workflow/executions/route';
import * as historyRoute from '@/api/routes/workflow/history/route';
import * as templateRoute from '@/api/routes/workflow/templates/route';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type RouteModule = Partial<Record<Method, (req: NextRequest, context?: { params: Record<string, string> }) => Promise<Response>>>;

function methodNotAllowed(method: string) {
  return NextResponse.json(
    { error: `Method ${method} not allowed on this endpoint` },
    { status: 405 }
  );
}

async function invoke(module: RouteModule, method: Method, req: NextRequest, params?: Record<string, string>) {
  const handler = module[method];
  if (!handler) {
    return methodNotAllowed(method);
  }
  return handler(req, params ? { params } : undefined);
}

function workflowIndex() {
  return NextResponse.json({
    service: 'workflow',
    endpoints: [
      '/api/workflows',
      '/api/workflows/:id',
      '/api/workflows/:id/triggers',
      '/api/workflows/:id/actions',
      '/api/workflows/:id/executions',
      '/api/workflows/:id/history',
      '/api/workflows/templates',
    ],
  });
}

export async function dispatchWorkflowRequest(
  req: NextRequest,
  method: Method,
  segments: string[]
) {
  const [head, id, child] = segments;

  if (!head) {
    return workflowIndex();
  }

  switch (head) {
    case 'templates':
      if (!id) {
        return invoke(templateRoute, method, req);
      }
      return invoke(templateRoute, method, req, { id });

    case 'history':
      if (!id) {
        return methodNotAllowed(method);
      }
      return invoke(historyRoute, method, req, { id });

    case 'executions':
      if (!id) {
        return invoke(executionRoute, method, req);
      }
      return invoke(executionRoute, method, req, { id });

    case 'triggers':
      if (!id) {
        return invoke(triggerRoute, method, req);
      }
      return invoke(triggerRoute, method, req, { id });

    case 'actions':
      if (!id) {
        return invoke(actionRoute, method, req);
      }
      return invoke(actionRoute, method, req, { id });

    default:
      if (!id) {
        return invoke(workflowRoute, method, req);
      }
      if (child === 'triggers') {
        return invoke(triggerRoute, method, req, { id });
      }
      if (child === 'actions') {
        return invoke(actionRoute, method, req, { id });
      }
      if (child === 'executions') {
        return invoke(executionRoute, method, req, { id });
      }
      if (child === 'history') {
        return invoke(historyRoute, method, req, { id });
      }
      return invoke(workflowRoute, method, req, { id });
  }
}
