import { NextRequest } from 'next/server';
import { dispatchWorkflowRequest } from '../_router';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return dispatchWorkflowRequest(req, 'GET', params.path || []);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return dispatchWorkflowRequest(req, 'POST', params.path || []);
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return dispatchWorkflowRequest(req, 'PATCH', params.path || []);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return dispatchWorkflowRequest(req, 'DELETE', params.path || []);
}
