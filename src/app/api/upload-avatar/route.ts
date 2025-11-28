import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from 'pinata';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL!
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file: File | null = formData.get("file") as unknown as File;
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    const { cid } = await pinata.upload.public.file(file)
    const url = await pinata.gateways.public.convert(cid);

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Failed to get IPFS URL' },
        { status: 500 }
      );
    }

    // Return the IPFS URL - the frontend will then call the backend to update the profile
    return NextResponse.json({
      success: true,
      data: { avatar: url }
    });

  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
