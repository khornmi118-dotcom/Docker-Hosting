<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TaskController extends Controller
{
    public function index()
    {
        $tasks = DB::select(
            'SELECT id, title, description, DATE_FORMAT(due_date, "%Y-%m-%d") as due_date, status, created_at FROM tasks ORDER BY created_at DESC'
        );

        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_date' => ['required', 'date'],
            'status' => ['nullable', 'in:Pending,Completed'],
        ], [
            'title.required' => 'Title is required.',
            'due_date.required' => 'A valid due date is required.',
            'due_date.date' => 'A valid due date is required.',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 400);
        }

        $status = $request->input('status', 'Pending');

        $id = DB::table('tasks')->insertGetId([
            'title' => trim($request->input('title')),
            'description' => trim((string) $request->input('description', '')),
            'due_date' => $request->input('due_date'),
            'status' => $status,
        ]);

        $task = DB::selectOne(
            'SELECT id, title, description, DATE_FORMAT(due_date, "%Y-%m-%d") as due_date, status, created_at FROM tasks WHERE id = ?',
            [$id]
        );

        return response()->json($task, 201);
    }

    public function update(Request $request, $id)
    {
        if (!ctype_digit((string) $id) || (int) $id <= 0) {
            return response()->json(['message' => 'Invalid task ID.'], 400);
        }

        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_date' => ['required', 'date'],
            'status' => ['required', 'in:Pending,Completed'],
        ], [
            'title.required' => 'Title is required.',
            'due_date.required' => 'A valid due date is required.',
            'due_date.date' => 'A valid due date is required.',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 400);
        }

        $affected = DB::update(
            'UPDATE tasks SET title = ?, description = ?, due_date = ?, status = ? WHERE id = ?',
            [
                trim($request->input('title')),
                trim((string) $request->input('description', '')),
                $request->input('due_date'),
                $request->input('status'),
                (int) $id,
            ]
        );

        if ($affected === 0) {
            $exists = DB::selectOne('SELECT id FROM tasks WHERE id = ?', [(int) $id]);
            if (!$exists) {
                return response()->json(['message' => 'Task not found.'], 404);
            }
        }

        $task = DB::selectOne(
            'SELECT id, title, description, DATE_FORMAT(due_date, "%Y-%m-%d") as due_date, status, created_at FROM tasks WHERE id = ?',
            [(int) $id]
        );

        return response()->json($task);
    }

    public function destroy($id)
    {
        if (!ctype_digit((string) $id) || (int) $id <= 0) {
            return response()->json(['message' => 'Invalid task ID.'], 400);
        }

        $affected = DB::delete('DELETE FROM tasks WHERE id = ?', [(int) $id]);

        if ($affected === 0) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        return response()->noContent();
    }
}