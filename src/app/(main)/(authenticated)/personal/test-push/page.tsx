import { PushNotificationTest } from '@/components/push-notification-test/push-notification-test';

export default function TestPushPage() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Тестирование Push-уведомлений</h1>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900 mb-2">
            Инструкция по тестированию:
          </h2>
          <ol className="list-decimal list-inside text-blue-800 text-sm space-y-1">
            <li>Нажмите "Запросить разрешение" (если ещё не запрошено)</li>
            <li>Разрешите уведомления в браузере</li>
            <li>Нажмите "Подписаться на push"</li>
            <li>Введите текст и нажмите "Отправить тестовое push"</li>
            <li>Уведомление должно появиться даже если страница неактивна</li>
          </ol>
        </div>

        <PushNotificationTest />
      </div>
    </div>
  );
}
