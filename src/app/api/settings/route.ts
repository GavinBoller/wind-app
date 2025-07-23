import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

async function getSettings() {
  let settings = await prisma.appSettings.findFirst();
  if (!settings) {
    // If no settings exist, create the first one with a secure default
    settings = await prisma.appSettings.create({
      data: { approvalRequired: true },
    });
  }
  return settings;
}

// GET /api/settings - Get current public app settings
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    approvalRequired: settings.approvalRequired,
  });
}

// PATCH /api/settings - Update app settings (Admin only)
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { approvalRequired } = await request.json();
  if (typeof approvalRequired !== 'boolean') {
    return new NextResponse('Invalid request body', { status: 400 });
  }

  const settings = await getSettings();
  const updatedSettings = await prisma.appSettings.update({
    where: { id: settings.id },
    data: { approvalRequired },
  });

  return NextResponse.json(updatedSettings);
}