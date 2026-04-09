// Core data types for the family tree application

export interface Member {
  id: string;
  name: string;
  last_name: string | null;
  birth_date: string | null;
  birthplace: string | null;
  work: string | null;
  age: number | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  member_id: string;
  related_member_id: string;
  relationship_type: 'parent' | 'child' | 'spouse';
  created_at: string;
}

export interface MemberWithRelationships extends Member {
  parents: Member[];
  children: Member[];
  spouses: Member[];
}

export interface TreeNode {
  id: string;
  data: Member;
  position: { x: number; y: number };
  type: 'member';
}

export interface MemberPosition {
  member_id: string;
  position_x: number;
  position_y: number;
  updated_at: string;
}

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
  type: 'parent' | 'spouse';
}

// API response types
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE = 'DUPLICATE',
  CYCLE_DETECTED = 'CYCLE_DETECTED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

// User types
export interface User {
  id: string;
  username: string;
  password: string;
  user_type: 'admin' | 'user';
  member_id: string | null;
  created_at: string;
  updated_at: string;
}

// Form data types
export interface MemberFormData {
  name: string;
  last_name: string | null;
  birth_date: string | null;
  birthplace: string | null;
  work: string | null;
  photo?: File;
}

export interface RelationshipFormData {
  member_id: string;
  related_member_id: string;
  relationship_type: 'parent' | 'child' | 'spouse';
}
