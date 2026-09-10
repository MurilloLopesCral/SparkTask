import { z } from 'zod';

export const loginSchema = z.object({
	email: z.email({ message: 'E-mail inválido' }),
	password: z.string().min(1, 'Informe sua senha')
});

export const signupSchema = z
	.object({
		name: z.string().min(1, 'Informe seu nome').max(60, 'Máximo de 60 caracteres'),
		password: z.string().min(8, 'Mínimo de 8 caracteres'),
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'As senhas não coincidem',
		path: ['confirmPassword']
	});
