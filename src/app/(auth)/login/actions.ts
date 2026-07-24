'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/get-site-url';
import { getNicknameUnits, NICKNAME_MAX_UNITS } from '@/lib/nickname';

function mapLoginErrorCode(message: string): string {
	const lower = message.toLowerCase();
	if (lower.includes('invalid login credentials')) return 'invalid_credentials';
	if (lower.includes('email not confirmed')) return 'email_not_confirmed';
	if (
		lower.includes('fetch failed') ||
		lower.includes('failed to fetch') ||
		lower.includes('network') ||
		lower.includes('econnrefused') ||
		lower.includes('enotfound')
	) {
		return 'auth_service_unreachable';
	}
	return 'unexpected_error';
}

export async function login(formData: FormData) {
	try {
		const supabase = await createClient();

		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			redirect('/login?error=missing_credentials');
		}

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			console.error('Login error:', error);
			const code = mapLoginErrorCode(error.message || '');
			redirect('/login?error=' + encodeURIComponent(code));
		}

		revalidatePath('/', 'layout');
	} catch (error) {
		console.error('Unexpected error during login:', error);
		if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
			throw error;
		}
		redirect('/login?error=unexpected_error');
	}

	redirect('/chat');
}

export async function signup(formData: FormData) {
	const supabase = await createClient();

	const email = formData.get('email') as string;
	const password = formData.get('password') as string;
	const name = ((formData.get('name') as string) || '').trim();
	const siteUrl = getSiteUrl();

	if (name && getNicknameUnits(name) > NICKNAME_MAX_UNITS) {
		redirect('/signup?error=name_too_long');
	}

	const { error, data } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				name
			},
			emailRedirectTo: `${siteUrl}auth/callback?next=/verified`
		}
	});

	if (error) {
		let code = 'unexpected_error';
		if (error.message.includes('User already registered')) {
			code = 'user_already_registered';
		}
		redirect('/signup?error=' + code);
	}

	if (data.user && !data.session) {
		redirect(`/verify?email=${encodeURIComponent(email)}`);
	}

	if (data.user) {
		const { error: profileError } = await supabase
			.from('user_profiles')
			.insert({ id: data.user.id, name: name, avatar_url: null });

		if (profileError) {
			console.error('Error creating profile:', profileError);
		}
	}

	revalidatePath('/', 'layout');
	redirect('/chat');
}

export async function signOut() {
	const supabase = await createClient();
	await supabase.auth.signOut();
	revalidatePath('/', 'layout');
	redirect('/');
}

export async function verifyEmail(formData: FormData) {
	const email = formData.get('email') as string;
	const token = formData.get('code') as string;

	if (!email || !token) {
		throw new Error('missing_code');
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.verifyOtp({
		email,
		token,
		type: 'signup'
	});

	if (error) {
		console.error('Verify error:', error);
		let code = 'unexpected_error';
		if (error.message.includes('Token has expired') || error.message.includes('Invalid token')) {
			code = 'invalid_code';
		}
		redirect(`/verify?email=${encodeURIComponent(email)}&error=${code}`);
	}

	redirect('/chat');
}

export async function resendOtp(email: string) {
	const supabase = await createClient();
	const { error } = await supabase.auth.resend({
		type: 'signup',
		email
	});

	if (error) {
		console.error('Resend error:', error);
		throw new Error('unexpected_error');
	}
}
