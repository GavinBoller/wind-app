import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import UserApprovedEmail from '@/emails/UserApprovedEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

// GET /api/admin/users - List all users
export async function GET() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(users);
}

// PATCH /api/admin/users - Approve a user
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { userId, approved } = await request.json();

  if (typeof userId !== 'string' || typeof approved !== 'boolean') {
    return new NextResponse('Invalid request body', { status: 400 });
  }

  // Fetch the user to check their current status before updating
  const userToUpdate = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userToUpdate) {
    return new NextResponse('User not found', { status: 404 });
  }

  // Determine if the user is being newly approved
  const isBeingNewlyApproved = approved === true && userToUpdate.approved === false;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { approved },
  });

  // If they were newly approved, send them a welcome email
  if (isBeingNewlyApproved && updatedUser.email) {
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: updatedUser.email,
        subject: 'Your Wind sniff Account is Approved!',
        react: UserApprovedEmail({
          userName: updatedUser.name,
          appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        }),
      });
    } catch (error) {
      console.error(`Failed to send approval email to ${updatedUser.email}:`, error);
    }
  }

  return NextResponse.json(updatedUser);
}

// PUT /api/admin/users - Update a user's role
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { userId, role } = await request.json();
  if (typeof userId !== 'string' || (role !== 'USER' && role !== 'ADMIN')) {
    return new NextResponse('Invalid request body', { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json(updatedUser);
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { userId } = await request.json();
  await prisma.user.delete({ where: { id: userId } });
  return new NextResponse(null, { status: 204 });
}