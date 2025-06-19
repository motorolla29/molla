import '@/styles/globals.css';
import Footer from '@/components/footer/footer';
import Header from '@/components/header/header';

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col justify-between">
      <Header />
      <main className="flex items-center justify-center">
        <h1>Тут ничего нет.</h1>
      </main>
      <Footer />
    </div>
  );
}
