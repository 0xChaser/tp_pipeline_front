import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from '../hooks/useTasks';
import * as taskApi from '../api/taskApi';
import type { Task } from '../types/task';

vi.mock('../api/taskApi');

const makeTask = (overrides: Partial<Task> = {}): Task => ({
	id: 1,
	title: 'Tâche',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
	...overrides,
});

beforeEach(() => {
	vi.resetAllMocks();
});

describe('useTasks', () => {
	it('loads tasks on mount', async () => {
		const tasks = [makeTask(), makeTask({ id: 2, title: 'Autre' })];
		vi.mocked(taskApi.getTasks).mockResolvedValue(tasks);

		const { result } = renderHook(() => useTasks());
		expect(result.current.loading).toBe(true);

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.tasks).toEqual(tasks);
		expect(result.current.error).toBeNull();
	});

	it('exposes an error message when loading fails', async () => {
		vi.mocked(taskApi.getTasks).mockRejectedValue(new Error('HTTP 500: boom'));

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.error).toBe('HTTP 500: boom');
		expect(result.current.tasks).toEqual([]);
	});

	it('addTask prepends the created task', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue([makeTask()]);
		const created = makeTask({ id: 99, title: 'Créée' });
		vi.mocked(taskApi.createTask).mockResolvedValue(created);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(() => result.current.addTask({ title: 'Créée' }));

		expect(taskApi.createTask).toHaveBeenCalledWith({ title: 'Créée' });
		expect(result.current.tasks[0]).toEqual(created);
		expect(result.current.tasks).toHaveLength(2);
	});

	it('editTask replaces the matching task', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue([makeTask(), makeTask({ id: 2 })]);
		const updated = makeTask({ id: 2, title: 'Renommée' });
		vi.mocked(taskApi.updateTask).mockResolvedValue(updated);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(() => result.current.editTask(2, { title: 'Renommée' }));

		expect(result.current.tasks.find((t) => t.id === 2)).toEqual(updated);
		expect(result.current.tasks.find((t) => t.id === 1)?.title).toBe('Tâche');
	});

	it('removeTask filters out the deleted task', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue([makeTask(), makeTask({ id: 2 })]);
		vi.mocked(taskApi.deleteTask).mockResolvedValue(undefined);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(() => result.current.removeTask(1));

		expect(taskApi.deleteTask).toHaveBeenCalledWith(1);
		expect(result.current.tasks).toHaveLength(1);
		expect(result.current.tasks[0].id).toBe(2);
	});

	it('toggleComplete inverts the completed flag of the task', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue([makeTask({ completed: false })]);
		const toggled = makeTask({ completed: true });
		vi.mocked(taskApi.updateTask).mockResolvedValue(toggled);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(() => result.current.toggleComplete(1));

		expect(taskApi.updateTask).toHaveBeenCalledWith(1, { completed: true });
		expect(result.current.tasks[0].completed).toBe(true);
	});

	it('toggleComplete does nothing for an unknown id', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue([makeTask()]);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(() => result.current.toggleComplete(404));
		expect(taskApi.updateTask).not.toHaveBeenCalled();
	});
});
