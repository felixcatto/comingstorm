import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export const middleware = async (request: NextRequest) => {
  console.log(`${request.method} ${request.nextUrl.pathname}`);
  return NextResponse.next();
};

export const config = {
  matcher: ['/((?!_next|favicon.ico|css|img|font).*)'],
};
