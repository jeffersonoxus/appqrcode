import Link from "next/link";

export default function Home() {
  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4 text-center">Gabarito App</h1>

      <Link
        href="/leitor"
        className="block w-full text-center py-3 bg-blue-600 text-white rounded-lg font-medium"
      >
        Abrir Leitor de QR Code
      </Link>
    </main>
  );
}