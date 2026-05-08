import { callAIChatJSON } from '@/lib/ai/client';
import { generateWithSingleRepair } from '@/lib/ai/phase2aQuality';
import type {
	GoalBriefInput,
	GoalSetupStepAOutput,
	GoalSetupStepBOutput,
	RescueOutput,
	ReviewOutput,
	TodayPlanOutput
} from '@/lib/ai/phase2aSchemas';
import {
	parseGoalSetupStepA,
	parseGoalSetupStepB,
	parseRescue,
	parseReview,
	parseTodayPlan
} from '@/lib/ai/phase2aSchemas';

type Locale = 'en' | 'zh';

function jsonOnlyRule(locale: Locale) {
	if (locale === 'zh') {
		return [
			'你是一个“产品化”的 AI 功能模块。',
			'你必须只输出严格 JSON（不能有多余文本、不能用 markdown、不能包裹代码块）。',
			'如果信息不足或无法满足硬规则，你必须按 schema 返回 need_more_info 或将 confidence=low，并保持结构可解析。'
		].join('\n');
	}
	return [
		'You are a product-grade AI module.',
		'You must output STRICT JSON only (no extra text, no markdown, no code fences).',
		'If context is insufficient, follow the schema and keep output parseable.'
	].join('\n');
}

function formatContext(context: unknown) {
	return JSON.stringify(context, null, 2);
}

export async function aiGoalSetupStepA(opts: { brief: GoalBriefInput; locale: Locale; today?: string }): Promise<GoalSetupStepAOutput> {
	const system = [
		jsonOnlyRule(opts.locale),
		'Schema: GoalSetupStepAOutput',
		'Output JSON shape:',
		'{',
		'  "type":"goal_setup_stepA",',
		'  "understanding":{"goal_summary":"string","key_constraints":["string"],"likely_failure_reasons":["string"],"leverage_point":"string"},',
		'  "clarifying_questions":[{"id":"q1","question":"string","type":"single_choice|short_text","options":["string"],"required":true}],',
		'  "need_more_info":{"blocking":false,"missing":["string"],"message":"string"},',
		'  "confidence":"low|medium|high"',
		'}',
		'Hard rules:',
		'- Default 2-3 clarifying_questions with low-friction single_choice/short_text.',
		'- If blocking=true: clarifying_questions must be [], missing must be 2-3 items.',
		'- understanding.goal_summary must be specific and readable.',
		'- No actions list in StepA.'
	].join('\n');

	const user = [
    'Reference date (YYYY-MM-DD, user local today):',
    opts.today || 'unknown',
		'GoalBrief (context JSON):',
		formatContext(opts.brief),
		'Task:',
		'- Produce understanding + 2-3 clarifying questions.',
		'- If key info missing, set need_more_info.blocking=true and list 2-3 minimal missing items.'
	].join('\n');

	return generateWithSingleRepair({
		locale: opts.locale,
		messages: [
			{ role: 'system', content: system },
			{ role: 'user', content: user }
		],
		call: (messages) => callAIChatJSON({ messages }),
		parse: parseGoalSetupStepA
	});
}

export async function aiGoalSetupStepB(opts: {
	brief: GoalBriefInput;
	answers: Record<string, string>;
	locale: Locale;
	today?: string;
}): Promise<GoalSetupStepBOutput> {
	const system = [
		jsonOnlyRule(opts.locale),
		'Schema: GoalSetupStepBOutput',
		'Output JSON shape:',
		'{',
		'  "type":"goal_setup_stepB",',
		'  "goal_draft":{"category":"string","priority":"high|medium|low","start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD"},',
		'  "actions":[{"title":"string","why":"string","definition_of_done":"string","estimated_minutes":10,"action_type":"core|maintenance|learning|review|rest","priority":"high|medium|low|null"}],',
		'  "success_criteria":[{"type":"outcome|process","text":"string"}],',
		'  "stop_criteria":[{"type":"resource|direction","text":"string"}],',
		'  "if_then_plans":[{"if":"string","then":"string","minimal_action_minutes":5}],',
		'  "confidence":"low|medium|high"',
		'}',
		'Hard rules:',
		'- goal_draft must be present even if GoalBrief has no dates; infer a reasonable start/end date window.',
		'- goal_draft.end_date must be >= goal_draft.start_date.',
		'- actions length 6-10; if insufficient info, 3-5 allowed only with confidence=low.',
		'- each action estimated_minutes must be 5-20, title executable (verb + object), definition_of_done verifiable.',
		'- actions array order must reflect execution order (earlier prerequisites first).',
		'- success_criteria must include at least 1 outcome and 1 process, total >=2.',
		'- stop_criteria must include at least 1 resource and 1 direction, total >=2.',
		'- if_then_plans length 1-2; minimal_action_minutes must be 5-10.'
	].join('\n');

	const user = [
		'Reference date (YYYY-MM-DD, user local today):',
		opts.today || 'unknown',
		'GoalBrief (context JSON):',
		formatContext(opts.brief),
		'Clarifying answers (JSON):',
		formatContext(opts.answers),
		'Task:',
		'- Generate draft actions + criteria + if-then plans.'
	].join('\n');

	return generateWithSingleRepair({
		locale: opts.locale,
		messages: [
			{ role: 'system', content: system },
			{ role: 'user', content: user }
		],
		call: (messages) => callAIChatJSON({ messages }),
		parse: parseGoalSetupStepB
	});
}

export async function aiTodayPlan(opts: {
	locale: Locale;
	today: string;
	goals: Array<{
		id: string;
		title: string;
		priority?: string | null;
		start_date?: string | null;
		end_date?: string | null;
		success_criteria?: string | null;
		stop_criteria?: string | null;
	}>;
	recent_context?: {
		completion_rate_7d?: number | null;
		core_created_7d?: number | null;
		core_completed_7d?: number | null;
		daily_score_avg_7d?: number | null;
		momentum_bucket?: 'high' | 'medium' | 'low' | 'unknown';
		likely_frictions?: string[] | null;
	};
	strategy?: {
		difficulty_mode?: 'starter' | 'balanced' | 'push';
		risk_level?: 'low' | 'medium' | 'high';
		selected_goal_id?: string | null;
		grounding_hints?: string[];
		user_profile_summary?: string | null;
		preferred_time_bucket?: string | null;
	};
}): Promise<TodayPlanOutput> {
	const system = [
		jsonOnlyRule(opts.locale),
		'Schema: TodayPlanOutput',
		'Output JSON shape:',
		'{',
		'  "type":"today_plan",',
		'  "recommendations":[{',
		'    "kind":"core|alt",',
		'    "goal_id":"string|null",',
		'    "reason":"string",',
		'    "variants":[',
		'      {"minutes":5,"title":"string","first_step":"string","definition_of_done":"string"},',
		'      {"minutes":10,"title":"string","first_step":"string","definition_of_done":"string"},',
		'      {"minutes":20,"title":"string","first_step":"string","definition_of_done":"string"}',
		'    ]',
		'  }],',
		'  "confidence":"low|medium|high"',
		'}',
		'Hard rules:',
		'- recommendations: exactly 1 core and at most 1 alt.',
		'- core goal_id must be one of provided goal ids unless you truly cannot decide.',
		'- variants must include 5/10/20 and represent estimated time options for the SAME action intent.',
		'- first_step must be 1 sentence <= 30 chars (Chinese) / <= 30 chars overall.',
		'- titles executable (verb + object).',
		'- title must describe a real action the user can do today, not a slogan or abstract summary.',
		'- reason explains why this action is recommended today; reason must not replace the action itself.',
		'- stay grounded in the provided goal title and criteria.',
		'- avoid vague phrases such as “推进MVP搭建”, “挑战新关卡”, “打怪”, “副本”, “升级”, “关键模块”, “系统优化” unless the goal title itself clearly uses those words.',
		'- do not invent a different domain from the goal title.',
		'- if you provide an alt recommendation, it must still be concrete and realistic today.',
		'- if strategy.selected_goal_id is provided, the core recommendation must use that goal_id.',
		'- if strategy.difficulty_mode is starter, make the 5-minute variant extremely easy to start.',
		'- if strategy.difficulty_mode is push, keep the 20-minute variant ambitious but still finishable today.'
	].join('\n');

	const user = [
		`Today: ${opts.today}`,
		'Candidate goals (JSON):',
		formatContext(opts.goals),
		'Recent context (optional JSON):',
		formatContext(opts.recent_context ?? {}),
		'Strategy context (optional JSON):',
		formatContext(opts.strategy ?? {}),
		'Task:',
		'- Pick ONE best core action for today and provide 5/10/20 estimated-time variants.',
		'- Provide at most one alternative option (kind=alt) only if there is a clearly valid second choice.',
		'- Every title should read like a task in a to-do list, not a strategy statement.',
		'- Prefer specific outputs, files, pages, conversations, drafts, or review actions over generic progress wording.',
		'- Use strategy.grounding_hints and user_profile_summary when explaining reason.',
		'Difficulty policy:',
		'- If momentum_bucket is high/medium: make the 10/20 variants slightly more challenging (still executable today).',
		'- If momentum_bucket is low/unknown or completion_rate_7d is low: make the 5-minute variant a very low-friction starter task.',
		'- Always keep 5/10/20 variants aligned to the same intent (granularity differs, not goal).',
		'Quality bar:',
		'- Good: “整理登录流程待修问题”, “写出首页文案初稿”, “补完支付回调测试”',
		'- Bad: “推进系统MVP搭建”, “挑战副本”, “继续升级项目”, “完成关键模块”'
	].join('\n');

	return generateWithSingleRepair({
		locale: opts.locale,
		messages: [
			{ role: 'system', content: system },
			{ role: 'user', content: user }
		],
		call: (messages) => callAIChatJSON({ messages }),
		parse: parseTodayPlan
	});
}

export async function aiRescue(opts: {
	locale: Locale;
	reason_tag: RescueOutput['reason_tag'];
	action: { id: string; title: string; description?: string | null };
	goal: { id: string; title: string };
	strategy?: {
		difficulty_mode?: 'starter' | 'balanced' | 'push';
		risk_level?: 'low' | 'medium' | 'high';
		grounding_hints?: string[];
	};
}): Promise<RescueOutput> {
	const system = [
		jsonOnlyRule(opts.locale),
		'Schema: RescueOutput',
		'Output JSON shape:',
		'{',
		'  "type":"rescue",',
		'  "reason_tag":"no_time|too_hard|anxiety|unclear_next|low_energy|other",',
		'  "minimal_variant":{"minutes":5,"title":"string","first_step":"string","definition_of_done":"string"},',
		'  "if_then":{"if":"string","then":"string"},',
		'  "confidence":"low|medium|high"',
		'}',
		'Hard rules:',
		'- minimal_variant.minutes must be 5.',
		'- minimal_variant must be executable and can be finished in 5-10 minutes.',
		'- first_step <= 30 chars.'
	].join('\n');

	const user = [
		'Goal (JSON):',
		formatContext(opts.goal),
		'Current action (JSON):',
		formatContext(opts.action),
		`Reason tag: ${opts.reason_tag}`,
		'Strategy context (optional JSON):',
		formatContext(opts.strategy ?? {}),
		'Task: Provide a 5-minute minimal version + if-then + first step.'
	].join('\n');

	return generateWithSingleRepair({
		locale: opts.locale,
		messages: [
			{ role: 'system', content: system },
			{ role: 'user', content: user }
		],
		call: (messages) => callAIChatJSON({ messages }),
		parse: parseRescue
	});
}

export async function aiReview(opts: {
	locale: Locale;
	today: string;
	score: number | null;
	answers: Record<string, string>;
	strategy?: {
		difficulty_mode?: 'starter' | 'balanced' | 'push';
		risk_level?: 'low' | 'medium' | 'high';
		grounding_hints?: string[];
	};
}): Promise<ReviewOutput> {
	const system = [
		jsonOnlyRule(opts.locale),
		'Schema: ReviewOutput',
		'Output JSON shape:',
		'{',
		'  "type":"review",',
		'  "summary_sentence":"string",',
		'  "detected_friction_tag":"string|null",',
		'  "tomorrow_card":{',
		'    "risk":"string",',
		'    "if_then":{"if":"string","then":"string"},',
		'    "suggested_core_action_direction":"string"',
		'  },',
		'  "confidence":"low|medium|high"',
		'}',
		'Hard rules:',
		'- summary_sentence <= 30 chars.',
		'- tomorrow_card.if_then.then must be a minimal action, not pressure.',
		'- Keep output short and actionable.'
	].join('\n');

	const user = [
		`Today: ${opts.today}`,
		`Score: ${opts.score == null ? 'null' : String(opts.score)}`,
		'Answers (JSON):',
		formatContext(opts.answers),
		'Strategy context (optional JSON):',
		formatContext(opts.strategy ?? {}),
		'Task: Summarize today in one sentence and provide a tomorrow anti-fail card.'
	].join('\n');

	try {
		return await generateWithSingleRepair({
			locale: opts.locale,
			messages: [
				{ role: 'system', content: system },
				{ role: 'user', content: user }
			],
			call: (messages) => callAIChatJSON({ messages }),
			parse: parseReview
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : 'operation_failed';
		if (message === 'missing_ai_key') throw new Error('missing_ai_key');
		return buildFallbackReview(opts.locale, opts.score, opts.answers);
	}
}

function buildFallbackReview(
	locale: Locale,
	score: number | null,
	answers: Record<string, string>
): ReviewOutput {
	const friction = answers.friction || null;

	const summary_sentence =
		locale === 'zh'
			? score != null && score <= 2
				? '今天不容易，但仍有推进。'
				: '今天完成了一个小闭环。'
			: score != null && score <= 2
				? 'Tough day, still made progress.'
				: 'Closed a small loop today.';

	const risk =
		locale === 'zh'
			? '明天容易被临时事务打断，导致不开工。'
			: 'Tomorrow may get derailed by unexpected tasks.';

	const iff =
		locale === 'zh'
			? '如果明天只剩 5 分钟'
			: 'If tomorrow you only have 5 minutes';
	const then =
		locale === 'zh'
			? '就先把核心行动的第一步做完。'
			: 'do only the first step of the core action.';
	const direction =
		locale === 'zh'
			? '从“最小可做的一步”开始，先保证连续性。'
			: 'Start with the smallest next step to keep momentum.';

	return {
		type: 'review',
		summary_sentence: summary_sentence.slice(0, 30),
		detected_friction_tag: friction,
		tomorrow_card: {
			risk,
			if_then: { if: iff, then },
			suggested_core_action_direction: direction
		},
		confidence: 'low'
	};
}
