import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
	let response = NextResponse.next({
		request: {
			headers: request.headers
		}
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value)
					);
					response = NextResponse.next({
						request: {
							headers: request.headers
						}
					});
					cookiesToSet.forEach(({ name, value, options }) =>
						response.cookies.set(name, value, options)
					);
				}
			}
		}
	);

	const {
		data: { user }
	} = await supabase.auth.getUser();

	// Protected routes
	if (
		request.nextUrl.pathname.startsWith('/dashboard') ||
		request.nextUrl.pathname.startsWith('/goals') ||
		request.nextUrl.pathname.startsWith('/profile') ||
		request.nextUrl.pathname.startsWith('/today')
	) {
		if (!user) {
			return NextResponse.redirect(new URL('/login', request.url));
		}
	}

	// Redirect to dashboard if logged in
	if (request.nextUrl.pathname === '/login') {
		if (user) {
			return NextResponse.redirect(new URL('/dashboard', request.url));
		}
	}

	return response;
}
