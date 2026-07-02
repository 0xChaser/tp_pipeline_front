import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const task: Task = {
	id: 7,
	title: 'Réviser le CI/CD',
	description: 'Jenkins et SonarQube',
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

const handlers = () => ({
	onToggle: vi.fn(),
	onDelete: vi.fn(),
	onEdit: vi.fn(),
});

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
	vi.useRealTimers();
});

describe('TaskItem', () => {
	it('renders title, description and formatted date', () => {
		render(<TaskItem task={task} {...handlers()} />);
		expect(screen.getByText('Réviser le CI/CD')).toBeInTheDocument();
		expect(screen.getByText('Jenkins et SonarQube')).toBeInTheDocument();
		expect(screen.getByText('15 janvier 2026')).toBeInTheDocument();
	});

	it('applies the completed style when task is completed', () => {
		render(<TaskItem task={{ ...task, completed: true }} {...handlers()} />);
		expect(screen.getByTestId('task-item')).toHaveClass('task-completed');
		expect(screen.getByRole('checkbox')).toBeChecked();
	});

	it('calls onToggle when the checkbox is clicked', async () => {
		const user = userEvent.setup();
		const h = handlers();
		render(<TaskItem task={task} {...h} />);

		await user.click(screen.getByRole('checkbox'));
		expect(h.onToggle).toHaveBeenCalledWith(7);
	});

	it('requires a confirmation click before deleting', async () => {
		const user = userEvent.setup();
		const h = handlers();
		render(<TaskItem task={task} {...h} />);

		const deleteBtn = screen.getByRole('button', { name: 'Supprimer' });
		await user.click(deleteBtn);
		expect(h.onDelete).not.toHaveBeenCalled();
		expect(deleteBtn).toHaveTextContent('⚠️');

		await user.click(deleteBtn);
		expect(h.onDelete).toHaveBeenCalledWith(7);
	});

	it('resets the delete confirmation after 3 seconds', async () => {
		const user = userEvent.setup();
		const h = handlers();
		render(<TaskItem task={task} {...h} />);

		const deleteBtn = screen.getByRole('button', { name: 'Supprimer' });
		await user.click(deleteBtn);
		expect(deleteBtn).toHaveTextContent('⚠️');

		act(() => {
			vi.advanceTimersByTime(3000);
		});
		expect(deleteBtn).toHaveTextContent('🗑️');
	});

	it('edits the task and calls onEdit with trimmed values', async () => {
		const user = userEvent.setup();
		const h = handlers();
		render(<TaskItem task={task} {...h} />);

		await user.click(screen.getByRole('button', { name: 'Modifier' }));

		const titleInput = screen.getByLabelText('Modifier le titre');
		await user.clear(titleInput);
		await user.type(titleInput, '  Nouveau titre  ');
		await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(h.onEdit).toHaveBeenCalledWith(7, {
			title: 'Nouveau titre',
			description: 'Jenkins et SonarQube',
		});
	});

	it('does not save when the edited title is empty', async () => {
		const user = userEvent.setup();
		const h = handlers();
		render(<TaskItem task={task} {...h} />);

		await user.click(screen.getByRole('button', { name: 'Modifier' }));
		await user.clear(screen.getByLabelText('Modifier le titre'));
		await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(h.onEdit).not.toHaveBeenCalled();
	});

	it('cancels editing and restores the original values', async () => {
		const user = userEvent.setup();
		const h = handlers();
		render(<TaskItem task={task} {...h} />);

		await user.click(screen.getByRole('button', { name: 'Modifier' }));
		const titleInput = screen.getByLabelText('Modifier le titre');
		await user.clear(titleInput);
		await user.type(titleInput, 'Modifié');
		await user.click(screen.getByRole('button', { name: 'Annuler' }));

		expect(h.onEdit).not.toHaveBeenCalled();
		expect(screen.getByText('Réviser le CI/CD')).toBeInTheDocument();
	});
});
