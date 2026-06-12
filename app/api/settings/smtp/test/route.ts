import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTransporter } from '@/lib/smtp';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { transporter } = await getTransporter(user.id);
    await transporter.verify();
    
    return NextResponse.json({ success: true, message: 'SMTP connection successful!' });
  } catch (error: any) {
    console.error("SMTP Test Error:", error);
    return NextResponse.json({ error: error.message || 'SMTP connection failed' }, { status: 500 });
  }
}
