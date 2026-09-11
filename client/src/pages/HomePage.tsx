import { Navbar } from '../components/Navbar'

export function HomePage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
        <span className="text-5xl">🍲</span>
        <h1 className="font-heading text-5xl tracking-wide text-charcoal sm:text-6xl">
          La Brigade
        </h1>
        <p className="max-w-md text-lg text-charcoal-light">
          La plateforme collaborative de recettes bistronomiques : proposez, partagez,
          dégustez.
        </p>
        <div className="mt-2 h-1 w-24 rounded-full bg-brigade-red" />
        <p className="text-sm text-olive">
          Recettes testées et validées par l'équipe du chef.
        </p>
      </main>
    </div>
  )
}
