import { NextRequest, NextResponse } from 'next/server';
import { TemplateService } from '@/services/workflow/template.service';
import { getEventBus } from '@/core/events/event-bus';
import { handleApiError, ApiError, validateCompanyId } from '@/api/middleware/error-handler';

const templateService = new TemplateService(getEventBus());

export async function GET(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);

    if (context?.params?.id) {
      const template = await templateService.getTemplate(context.params.id, companyId);
      if (!template) {
        throw new ApiError(404, 'Template not found');
      }
      return NextResponse.json(template);
    }

    const templates = await templateService.listTemplates(companyId);
    return NextResponse.json(templates);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const body = await req.json();

    if (!body.name || !body.templateType || !body.payload) {
      throw new ApiError(400, 'Missing required fields: name, templateType, payload');
    }

    const template = await templateService.createTemplate(companyId, {
      name: body.name,
      templateType: body.templateType,
      payload: body.payload,
      metadata: body.metadata,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const body = await req.json();
    const templateId = context?.params?.id;

    if (!templateId) {
      throw new ApiError(400, 'Template id is required');
    }

    const template = await templateService.updateTemplate(templateId, companyId, {
      name: body.name,
      payload: body.payload,
      metadata: body.metadata,
    });

    return NextResponse.json(template);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const templateId = context?.params?.id;

    if (!templateId) {
      throw new ApiError(400, 'Template id is required');
    }

    await templateService.deleteTemplate(templateId, companyId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
