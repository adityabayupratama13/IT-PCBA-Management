import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Create safe filename
    const filename = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file to public/uploads
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return the URL path
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
