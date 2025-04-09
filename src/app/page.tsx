import Link from "next/link";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">Whispers Beyond</h1>
      <Link href="/lobby" className="text-blue-600 underline">
        Gå till lobbyn
      </Link>
    </main>
  );
}