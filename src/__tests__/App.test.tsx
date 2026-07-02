import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import * as taskApi from '../api/taskApi';
import type { Task } from '../types/task';

vi.mock('../api/taskApi');

const tasks: Task[] = [
	{
		id: 1,
		title: 'Tâche en cours',
		description: null,
		completed: false,
		createdAt: '2026-01-15T10:00:00Z',
		updatedAt: '2026-01-15T10:00:00Z',
	},
	{
		id: 2,
		title: 'Tâche finie',
		description: null,
		completed: true,
		createdAt: '2026-01-16T10:00:00Z',
		updatedAt: '2026-01-16T10:00:00Z',
	},
];

beforeEach(() => {
	vi.resetAllMocks();
});

describe('App', () => {
	it('renders the header and the task list after loading', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue(tasks);
		render(<App />);

		expect(screen.getByText('Mes Tâches')).toBeInTheDocument();
		expect(screen.getByTestId('loading')).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId('task-list')).toBeInTheDocument());
		expect(screen.getByText('Tâche en cours')).toBeInTheDocument();
		expect(screen.getByText('Tâche finie')).toBeInTheDocument();
	});

	it('shows header stats (total, terminées, en cours)', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue(tasks);
		render(<App />);

		await waitFor(() => expect(screen.getByText('Total')).toBeInTheDocument());
		expect(screen.getByText('Terminées')).toBeInTheDocument();
		expect(screen.getByText('En cours')).toBeInTheDocument();
	});

	it('shows the error state when the API fails', async () => {
		vi.mocked(taskApi.getTasks).mockRejectedValue(new Error('HTTP 503: down'));
		render(<App />);

		await waitFor(() => expect(screen.getByTestId('error')).toBeInTheDocument());
		expect(screen.getByText(/HTTP 503/)).toBeInTheDocument();
	});

	it('adds a task through the form', async () => {
		const user = userEvent.setup();
		vi.mocked(taskApi.getTasks).mockResolvedValue([]);
		vi.mocked(taskApi.createTask).mockResolvedValue({
			id: 3,
			title: 'Nouvelle',
			description: null,
			completed: false,
			createdAt: '2026-01-17T10:00:00Z',
			updatedAt: '2026-01-17T10:00:00Z',
		});
		render(<App />);

		await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());

		await user.type(screen.getByLabelText('Titre'), 'Nouvelle');
		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		await waitFor(() => expect(screen.getByText('Nouvelle')).toBeInTheDocument());
		expect(taskApi.createTask).toHaveBeenCalledWith({ title: 'Nouvelle', description: undefined });
	});
});
