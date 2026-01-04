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
		data: { user },
		error
	} = await supabase.auth.getUser();

	// Handle invalid/expired refresh token: clear supabase auth cookies and continue as unauthenticated
	if (
		error &&
		(error.message?.includes('Invalid Refresh Token') ||
			error.message?.includes('refresh_token_not_found'))
	) {
		const allCookies = request.cookies.getAll();
		for (const c of allCookies) {
			if (c.name.startsWith('sb:')) {
				response.cookies.delete(c.name);
			}
		}
	}

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
		// Require email confirmation
		// @ts-expect-error user may not have email_confirmed_at property depending on auth provider
		if (!user.email_confirmed_at) {
			return NextResponse.redirect(
				new URL(
					'/login?error=' +
						encodeURIComponent(
							'Please verify your email before accessing the app'
						),
					request.url
				)
			);
		}
	}

	// Redirect to dashboard if logged in
	if (
		request.nextUrl.pathname === '/login' ||
		request.nextUrl.pathname === '/signup' ||
		request.nextUrl.pathname === '/forgot' ||
		request.nextUrl.pathname === '/reset'
	) {
		if (user) {
			return NextResponse.redirect(new URL('/dashboard', request.url));
		}
	}

	// i18n: Set default locale if not present
	if (!request.cookies.has('NEXT_LOCALE')) {
		const acceptLanguage = request.headers.get('accept-language') || '';
		const locale = acceptLanguage.includes('zh') ? 'zh' : 'en';
		response.cookies.set('NEXT_LOCALE', locale);
	}

	return response;
}
