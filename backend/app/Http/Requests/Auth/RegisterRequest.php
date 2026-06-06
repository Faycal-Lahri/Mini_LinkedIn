<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', 'string', 'in:STUDENT,TEACHER,RESEARCHER'],
            'institution' => ['nullable', 'string', 'max:255'],
            'diploma' => ['required_if:role,TEACHER,RESEARCHER', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'certification' => ['required_if:role,TEACHER,RESEARCHER', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }
}
