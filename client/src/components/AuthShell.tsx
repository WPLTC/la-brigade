import type { ReactNode } from 'react'

interface AuthShellProps {
  eyebrow: string
  title: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ eyebrow, title, children, footer }: AuthShellProps) {
  return (
    <div className="mx-auto grid max-w-5xl px-4 py-10 md:grid-cols-2 md:py-16">
      <div className="relative hidden overflow-hidden rounded-l-[2.5rem] md:block">
        <img src="/images/tablee.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-charcoal/90 via-charcoal/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-cream">
          <p className="font-heading text-4xl leading-none uppercase">Proposez. Testez. Savourez.</p>
          <p className="mt-3 text-sm text-cream/80">
            Rejoignez les passionnés dont les recettes sont testées et validées par la brigade du chef.
          </p>
        </div>
      </div>
      <div className="card rounded-[2.5rem] p-8 sm:p-10 md:rounded-l-none">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 font-heading text-4xl uppercase">{title}</h1>
        <div className="mt-8">{children}</div>
        <div className="mt-8 border-t border-charcoal/10 pt-6 text-center text-sm text-charcoal-light">{footer}</div>
      </div>
    </div>
  )
}
