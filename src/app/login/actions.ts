'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
	try {
		const supabase = await createClient();

		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			redirect('/login?error=' + encodeURIComponent('Email and password are required'));
		}

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			console.error('Login error:', error);
			redirect('/login?error=' + encodeURIComponent(error.message));
		}

		revalidatePath('/', 'layout');
	} catch (error) {
		console.error('Unexpected error during login:', error);
		if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
			throw error;
		}
		redirect('/login?error=' + encodeURIComponent('An unexpected error occurred'));
	}
	
	redirect('/dashboard');
}

export async function signup(formData: FormData) {
	const supabase = await createClient();

	const email = formData.get('email') as string;
	const password = formData.get('password') as string;
	const name = formData.get('name') as string;

	const { error, data } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				name
			}
		}
	});

	if (error) {
		redirect('/signup?error=' + encodeURIComponent(error.message));
	}

	if (data.user && !data.session) {
		redirect(
			'/signup?message=' +
				encodeURIComponent(
					'Registration successful! Please check your email to confirm your account.'
				)
		);
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
