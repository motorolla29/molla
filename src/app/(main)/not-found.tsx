import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-stone-600">
      <img
        className="w-20 xl:w-32 mb-2 "
        src="https://ik.imagekit.io/motorolla29/molla/icons/oshibka_404.svg"
        alt="404"
      />
      <h1 className="text-sm xl:text-xl font-semibold mb-5">Тут ничего нет.</h1>
      <Link
        href="/"
        className="text-sm xl:text-xl text-white bg-violet-400 px-5 py-2 rounded-xl hover:bg-violet-500 active:bg-violet-600"
      >
        На главную
      </Link>
    </div>
  );
}
