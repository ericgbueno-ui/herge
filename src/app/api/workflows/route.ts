import { NextRequest } from 'next/server';
import { dispatchWorkflowRequest } from './_router';

export async function GET(req: NextRequest) {
  return dispatchWorkflowRequest(req, 'GET', []);
}

export async function POST(req: NextRequest) {
  return dispatchWorkflowRequest(req, 'POST', []);
}

export async function PATCH(req: NextRequest) {
  return dispatchWorkflowRequest(req, 'PATCH', []);
}

export async function DELETE(req: NextRequest) {
  return dispatchWorkflowRequest(req, 'DELETE', []);
}
