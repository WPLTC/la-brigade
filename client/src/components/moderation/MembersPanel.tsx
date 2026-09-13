import { Search, ShieldMinus, ShieldPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { Member, Role } from '../../lib/types'
import { Avatar, PageLoader, RoleBadge } from '../ui'

export function MembersPanel() {
  const { user } = useAuth()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [members, setMembers] = useState<Member[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      api
        .get<Member[]>(`/moderation/users?search=${encodeURIComponent(search.trim())}`)
        .then(setMembers)
        .catch((err) => setError(errorMessage(err)))
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

  async function toggleRole(member: Member) {
    const role: Role = member.role === 'CHEF_TEAM' ? 'USER' : 'CHEF_TEAM'
    setBusyId(member.id)
    try {
      await api.patch(`/moderation/users/${member.id}/role`, { role })
      setMembers((current) => current?.map((m) => (m.id === member.id ? { ...m, role } : m)) ?? null)
      toast.success(role === 'CHEF_TEAM' ? `${member.name} rejoint la brigade` : `${member.name} ne fait plus partie de la brigade`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Membres de la communauté</h2>
          <p className="text-sm text-charcoal-light">Donnez l'accès à l'espace brigade aux membres de l'équipe du chef.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-charcoal-light" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom ou email…"
            aria-label="Rechercher un membre"
            className="input pl-9"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-brigade-red">{error}</p>}

      {!members ? (
        <PageLoader />
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs tracking-wider text-charcoal-light uppercase">
              <tr className="border-b border-charcoal/10">
                <th className="py-2 pr-3 font-semibold">Membre</th>
                <th className="px-3 py-2 font-semibold">Recettes</th>
                <th className="px-3 py-2 font-semibold">Notes / avis</th>
                <th className="px-3 py-2 font-semibold">Inscription</th>
                <th className="py-2 pl-3 text-right font-semibold">Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} size="sm" />
                      <div className="min-w-0">
                        <Link to={`/users/${member.id}`} className="flex items-center gap-2 font-semibold hover:text-brigade-red">
                          {member.name} <RoleBadge role={member.role} />
                        </Link>
                        <p className="truncate text-xs text-charcoal-light">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">{member._count.recipes}</td>
                  <td className="px-3 py-3">
                    {member._count.ratings} / {member._count.comments}
                  </td>
                  <td className="px-3 py-3 text-charcoal-light">{formatDate(member.createdAt)}</td>
                  <td className="py-3 pl-3 text-right">
                    {member.id === user?.id ? (
                      <span className="text-xs text-charcoal-light">C'est toi</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleRole(member)}
                        disabled={busyId === member.id}
                        className={`btn btn-sm ${member.role === 'CHEF_TEAM' ? 'btn-secondary' : 'btn-dark'}`}
                      >
                        {member.role === 'CHEF_TEAM' ? (
                          <>
                            <ShieldMinus /> Retirer de la brigade
                          </>
                        ) : (
                          <>
                            <ShieldPlus /> Ajouter à la brigade
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && <p className="py-8 text-center text-sm text-charcoal-light">Aucun membre trouvé.</p>}
        </div>
      )}
    </section>
  )
}
