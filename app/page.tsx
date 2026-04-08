import { createClient } from '@/lib/supabase/server';
import FamilyTreeApp from './components/FamilyTreeApp';
import type { Member, Relationship } from '@/lib/types';

export default async function Home() {
  const supabase = await createClient();

  // Fetch initial members and relationships server-side
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: true });

  const { data: relationships } = await supabase
    .from('relationships')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <FamilyTreeApp
      initialMembers={(members as Member[]) || []}
      initialRelationships={(relationships as Relationship[]) || []}
    />
  );
}
