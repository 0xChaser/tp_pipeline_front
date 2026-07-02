import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
	it('renders create mode by default', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
	});

	it('renders edit mode with initial values', () => {
		render(
			<TaskForm
				onSubmit={vi.fn()}
				mode="edit"
				initialValues={{ title: 'Ma tâche', description: 'Détails' }}
			/>
		);
		expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
		expect(screen.getByLabelText('Titre')).toHaveValue('Ma tâche');
		expect(screen.getByLabelText('Description')).toHaveValue('Détails');
		expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
	});

	it('shows a validation error when title is empty', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);

		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('clears the validation error when typing again', async () => {
		const user = userEvent.setup();
		render(<TaskForm onSubmit={vi.fn()} />);

		await user.click(screen.getByRole('button', { name: 'Ajouter' }));
		expect(screen.getByRole('alert')).toBeInTheDocument();

		await user.type(screen.getByLabelText('Titre'), 'a');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('submits trimmed values and resets fields in create mode', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);

		await user.type(screen.getByLabelText('Titre'), '  Course  ');
		await user.type(screen.getByLabelText('Description'), '  Acheter du lait  ');
		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(onSubmit).toHaveBeenCalledWith({
			title: 'Course',
			description: 'Acheter du lait',
		});
		expect(screen.getByLabelText('Titre')).toHaveValue('');
		expect(screen.getByLabelText('Description')).toHaveValue('');
	});

	it('omits description when it is empty', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);

		await user.type(screen.getByLabelText('Titre'), 'Sans description');
		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(onSubmit).toHaveBeenCalledWith({
			title: 'Sans description',
			description: undefined,
		});
	});

	it('keeps values after submit in edit mode and calls onCancel', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		const onCancel = vi.fn();
		render(
			<TaskForm
				onSubmit={onSubmit}
				onCancel={onCancel}
				mode="edit"
				initialValues={{ title: 'Titre initial' }}
			/>
		);

		await user.click(screen.getByRole('button', { name: 'Modifier' }));
		expect(onSubmit).toHaveBeenCalledWith({ title: 'Titre initial', description: undefined });
		expect(screen.getByLabelText('Titre')).toHaveValue('Titre initial');

		await user.click(screen.getByRole('button', { name: 'Annuler' }));
		expect(onCancel).toHaveBeenCalled();
	});
});
