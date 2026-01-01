'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';

export async function deleteAccount() {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error('User not authenticated');
	}

	// Create a Supabase client with the Service Role Key to perform admin actions
	const supabaseAdmin = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{
			cookies: {
				getAll() {
					return [];
				},
				setAll(cookiesToSet) {}
			}
		}
	);

	const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

	if (error) {
		console.error('Error deleting user:', error);
		throw new Error('Failed to delete account');
	}

	redirect('/login');
}

export async function updateProfile(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return;

	const name = ((formData.get('name') as string) || '').trim();
	const timezone = ((formData.get('timezone') as string) || '').trim();
	const locale = ((formData.get('locale') as string) || '').trim();
	const avatar_url = ((formData.get('avatar_url') as string) || '').trim();

	if (name && name.length > 64) {
		throw new Error('Name too long');
	}
	const allowedLocales = ['en', 'zh'];
	const allowedTimezones = [
		'UTC',
		'Asia/Shanghai',
		'America/New_York',
		'Europe/London'
	];

	const tz = allowedTimezones.includes(timezone) ? timezone : 'UTC';
	const loc = allowedLocales.includes(locale) ? locale : undefined;

	const { data: existing } = await supabase
		.from('user_profiles')
		.select('avatar_url')
		.eq('id', user.id)
		.maybeSingle();
	const oldUrl = (existing?.avatar_url as string | undefined) || undefined;

	const payload: {
		id: string;
		name: string | null;
		timezone: string;
		locale?: string;
		avatar_url?: string;
	} = {
		id: user.id,
		name: name || null,
		timezone: tz,
		locale: loc
	};
	if (avatar_url) payload.avatar_url = avatar_url;
	const { error } = await supabase.from('user_profiles').upsert(payload);

	if (error) {
		revalidatePath('/profile');
		throw new Error(error.message);
	}

	if (name) {
		await supabase.auth.updateUser({ data: { name } });
	}

	if (avatar_url && oldUrl && oldUrl !== avatar_url) {
		const prefix = '/storage/v1/object/public/avatars/';
		const idx = oldUrl.indexOf(prefix);
		if (idx >= 0) {
			const objectPath = oldUrl.slice(idx + prefix.length);
			await supabase.storage.from('avatars').remove([objectPath]);
		}
	}

	revalidatePath('/profile');
	return { ok: true };
}

export async function updateAvatarUrl(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return;
	const avatar_url = ((formData.get('avatar_url') as string) || '').trim();
	if (!avatar_url) return;
	const { error } = await supabase.from('user_profiles').upsert({
		id: user.id,
		avatar_url
	});
	if (error) {
		if (
			error.message?.includes('Could not find') ||
			error.code === '42703' ||
			error.message?.includes('column')
		) {
			await supabase.auth.updateUser({ data: { avatar_url } });
		} else {
			throw new Error(error.message);
		}
	}
	revalidatePath('/profile');
}
