export interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    slug: string;
    thumbnail_url: string;
    instructor_id: string;
    instructor: User;
    price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    duration_hours: number;
    students_count: number;
    rating: number;
    categories: string[];
    created_at: string;
    updated_at: string;
}

export interface Lesson {
    id: string;
    course_id: string;
    title: string;
    description: string;
    video_url: string;
    duration_seconds: number;
    order: number;
    created_at: string;
}

export interface Enrollment {
    id: string;
    user_id: string;
    course_id: string;
    course: Course;
    started_at: string;
    completed_at?: string;
    progress: number;
}

export interface Payment {
    id: string;
    user_id: string;
    course_id: string;
    amount: number;
    currency: string;
    stripe_payment_id: string;
    status: 'succeeded' | 'pending' | 'failed';
    created_at: string;
}

export interface Review {
    id: string;
    course_id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
}

export interface ContactFormValues {
    email: string;
    name: string;
    subject: string;
    message: string;
}
