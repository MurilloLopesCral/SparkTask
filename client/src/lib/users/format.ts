export function getInitials(name: string | null | undefined, email: string) {
	return (name?.trim() || email)
		.split(/\s+/)
		.map((part) => part[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();
}
