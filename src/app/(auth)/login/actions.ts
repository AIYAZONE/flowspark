'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/get-site-url';

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
			let code = error.message;
			if (error.message.includes('Invalid login credentials')) {
				code = 'invalid_credentials';
			} else if (error.message.includes('Email not confirmed')) {
				code = 'email_not_confirmed';
			}
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

	redirect('/dashboard');
}

export async function signup(formData: FormData) {
	const supabase = await createClient();

	const email = formData.get('email') as string;
	const password = formData.get('password') as string;
	const name = formData.get('name') as string;
	const siteUrl = getSiteUrl();

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
		redirect('/signup?message=registration_success');
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
	redirect('/dashboard');
}

export async function signOut() {
	const supabase = await createClient();
	await supabase.auth.signOut();
	revalidatePath('/', 'layout');
	redirect('/');
}
