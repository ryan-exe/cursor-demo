import { useEffect, useState, useCallback } from 'react';
import { AVATAR_COLORS } from '../constants/theme';
import { storageGetItem, storageSetItem } from './persistStorage';

export interface TeamMember {
  id: string;
  name: string;
  avatarColor: string;
}

const STORAGE_KEY = '@standup_team';

const DEFAULT_TEAM: TeamMember[] = [
  { id: '1', name: 'Alex', avatarColor: AVATAR_COLORS[0] },
  { id: '2', name: 'Jordan', avatarColor: AVATAR_COLORS[1] },
  { id: '3', name: 'Sam', avatarColor: AVATAR_COLORS[2] },
];

export function useTeamStore() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storageGetItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setTeam(JSON.parse(raw));
        } catch {
          setTeam(DEFAULT_TEAM);
        }
      } else {
        setTeam(DEFAULT_TEAM);
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((next: TeamMember[]) => {
    setTeam(next);
    void storageSetItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addMember = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const next: TeamMember = {
        id: Date.now().toString(),
        name: trimmed,
        avatarColor: AVATAR_COLORS[team.length % AVATAR_COLORS.length],
      };
      persist([...team, next]);
    },
    [team, persist]
  );

  const removeMember = useCallback(
    (id: string) => {
      persist(team.filter((m) => m.id !== id));
    },
    [team, persist]
  );

  const updateMember = useCallback(
    (id: string, name: string) => {
      persist(team.map((m) => (m.id === id ? { ...m, name } : m)));
    },
    [team, persist]
  );

  return { team, loaded, addMember, removeMember, updateMember };
}
