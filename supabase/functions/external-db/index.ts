import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Connect to external PostgreSQL
async function getDbConnection() {
  const host = Deno.env.get('POSTGRESQL_HOST');
  const port = Deno.env.get('POSTGRESQL_PORT');
  const user = Deno.env.get('POSTGRESQL_USER');
  const password = Deno.env.get('POSTGRESQL_PASSWORD');
  const dbname = Deno.env.get('POSTGRESQL_DBNAME');

  if (!host || !port || !user || !password || !dbname) {
    throw new Error('PostgreSQL configuration not found');
  }

  console.log('Connecting to PostgreSQL:', { host, port, user, dbname });

  // Use postgres client from deno
  const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
  
  const client = new Client({
    hostname: host,
    port: parseInt(port),
    user: user,
    password: password,
    database: dbname,
    tls: {
      enabled: false, // Try without TLS first for internal network
    },
  });
  
  await client.connect();
  return client;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    let client;

    try {
      client = await getDbConnection();

      switch (action) {
        case 'get_lessons': {
          // Get all lessons for a course
          const result = await client.queryObject`
            SELECT * FROM lessons WHERE course_id = ${data.course_id} ORDER BY order_index
          `;
          return new Response(JSON.stringify({ success: true, lessons: result.rows }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'get_lesson_content': {
          // Get lesson content with images
          const result = await client.queryObject`
            SELECT l.*, 
              (SELECT json_agg(li.*) FROM lesson_images li WHERE li.lesson_id = l.id) as images
            FROM lessons l 
            WHERE l.id = ${data.lesson_id}
          `;
          return new Response(JSON.stringify({ success: true, lesson: result.rows[0] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'save_lesson': {
          // Save or update lesson
          const { id, course_id, title, content, order_index } = data;
          if (id) {
            await client.queryObject`
              UPDATE lessons SET title = ${title}, content = ${content}, updated_at = NOW()
              WHERE id = ${id}
            `;
          } else {
            await client.queryObject`
              INSERT INTO lessons (course_id, title, content, order_index)
              VALUES (${course_id}, ${title}, ${content}, ${order_index})
            `;
          }
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'save_lesson_image': {
          // Save image reference
          const { lesson_id, image_url, caption, order_index } = data;
          await client.queryObject`
            INSERT INTO lesson_images (lesson_id, image_url, caption, order_index)
            VALUES (${lesson_id}, ${image_url}, ${caption || ''}, ${order_index || 0})
          `;
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'init_schema': {
          // Create tables if they don't exist
          await client.queryObject`
            CREATE TABLE IF NOT EXISTS courses (
              id SERIAL PRIMARY KEY,
              slug VARCHAR(100) UNIQUE NOT NULL,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              emoji VARCHAR(10),
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            )
          `;
          
          await client.queryObject`
            CREATE TABLE IF NOT EXISTS lessons (
              id SERIAL PRIMARY KEY,
              course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
              title VARCHAR(255) NOT NULL,
              content TEXT,
              duration VARCHAR(50),
              type VARCHAR(20) DEFAULT 'text',
              order_index INTEGER DEFAULT 0,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            )
          `;
          
          await client.queryObject`
            CREATE TABLE IF NOT EXISTS lesson_images (
              id SERIAL PRIMARY KEY,
              lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
              image_url TEXT NOT NULL,
              caption TEXT,
              order_index INTEGER DEFAULT 0,
              created_at TIMESTAMP DEFAULT NOW()
            )
          `;

          return new Response(JSON.stringify({ success: true, message: 'Schema initialized' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'seed_alipay_content': {
          // Seed Alipay course content from the guide
          
          // First, create or get the course
          const courseResult = await client.queryObject`
            INSERT INTO courses (slug, title, description, emoji)
            VALUES ('alipay', 'Регистрация Alipay', 'Полный гайд по установке, регистрации и настройке Alipay для покупок в Китае.', '💳')
            ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
            RETURNING id
          `;
          
          const courseId = (courseResult.rows[0] as { id: number }).id;
          
          // Clear existing lessons for this course
          await client.queryObject`DELETE FROM lessons WHERE course_id = ${courseId}`;
          
          // Add lessons with content
          const lessons = [
            {
              title: 'Установка Alipay',
              duration: '5 мин',
              type: 'video',
              content: `Alipay доступен для установки в AppStore и PlayMarket. В поисковой строке введите «Alipay» и нажмите на кнопку «установить».

Alipay - это китайский электронный кошелек и целая экосистема сервисов с помощью которых можно совершать покупки в Китае и на китайских маркетплейсах.

Alipay, Taobao, Tmall, Goofish и 1688.com принадлежат корпорации Alibaba Group. Именно поэтому, верифицировав Alipay и зарегистрировавшись на 1 из этих площадок, Вы автоматически регистрируетесь и получаете доступ к остальным площадкам, входящим в эту группу.

Для того, чтобы зарегистрироваться и верифицировать Alipay понадобится номер телефона, действующий загранпаспорт и 10 минут свободного времени.`,
              images: ['https://thb.tildacdn.com/tild3331-6635-4038-a131-633434613135/-/empty/1272.jpg']
            },
            {
              title: 'Регистрация Alipay',
              duration: '10 мин',
              type: 'video',
              content: `Для регистрации переходим в Alipay, в начальном окне со строкой для ввода номера телефона нажимаем на «+86», в поиске находим и выбираем Россию «Russia» с кодом +7, вводим номер телефона и нажимаем на кнопку «Sign up».

После этого подтверждаем сервисное соглашение по кнопке «Agree», проходим капчу и подтверждаем ее по кнопке «Confirm».

Финальный шаг регистрации - подтверждение номера телефона по «sms» коду. На номер телефона, который указывали ранее придет шестизначный код от Alipay, вводим его и в открывшемся окне выбираем Россию «Russia» в качестве «Страны/Региона».

На этом первичный этап регистрации окончен, теперь можно будет приступить к настройке и верификации аккаунта.`,
              images: [
                'https://thb.tildacdn.com/tild3464-3466-4432-a164-393866346336/-/empty/1276.jpg',
                'https://thb.tildacdn.com/tild6133-3832-4935-b835-323537663937/-/empty/1277.jpg',
                'https://thb.tildacdn.com/tild6161-3731-4837-b032-373131666631/-/empty/1278.jpg'
              ]
            },
            {
              title: 'Переключение на международную версию',
              duration: '5 мин',
              type: 'text',
              content: `Сразу после завершения регистрации приложение предлагает перейти нам на международную версию с более понятным и простым интерфейсом. Для этого в нижней части экрана нажимаем на кнопку «Switch», меняем режим со «Standard» на «International» и после успешного выбора нажимаем на кнопку «Save».

Если вдруг вы не успели нажать на кнопку «Switch» в нижней части экрана, то не расстраивайтесь, это можно сделать через настройки приложения. Для этого переходим в раздел «Me/Account» через нижнюю панель управления, затем нажимаем на «шестеренку» в правом верхнем углу и переходим в раздел «Switch Version», где можно будет таким же образом изменить версию приложения.`,
              images: [
                'https://thb.tildacdn.com/tild3664-3832-4162-a366-313031666232/-/empty/1279.jpg',
                'https://thb.tildacdn.com/tild3637-3366-4433-a164-383932333361/-/empty/1273.jpg'
              ]
            },
            {
              title: 'Верификация Alipay',
              duration: '15 мин',
              type: 'video',
              content: `Для прохождения верификации переходим в «настройки», затем «Account and Security» и в открывшемся окне выбираем «identity information».

Далее необходимо выбрать «Страну/Регион» (Russia) и «Тип документа» (Passport), который будет использован для подтверждения личности. Затем по порядку заполняем обязательные поля:

1) Фамилия и имя латиницей, как в загранпаспорте
2) Номер паспорта
3) Пол
4) Дата рождения
5) Паспорт действителен до…

Либо сканируем паспорт, чтобы поля заполнились автоматически. Необходимо поместить паспорт в рамку, затем сделать фото, чтобы приложение отсканировало данные.

В разделе «Occupation type» (род деятельности) выбираем «Other».
В разделе «Address» заполняем адрес проживания латиницей.

Для завершения верификации осталось пройти верификацию по лицу. Несколько секунд внимательно смотрим в камеру, пока проходит сканирование лица.

У полностью верифицированного аккаунта Alipay рядом с ФИО будет красоваться надпись «Verified».`,
              images: [
                'https://thb.tildacdn.com/tild6531-3132-4562-b838-353533616363/-/empty/1280.jpg',
                'https://thb.tildacdn.com/tild3230-3039-4363-b263-303734613663/-/empty/1274.jpg',
                'https://thb.tildacdn.com/tild6535-6162-4731-b935-653039383832/-/empty/1254.jpg',
                'https://thb.tildacdn.com/tild3239-3563-4137-b436-396135393733/-/empty/1262.jpg'
              ]
            },
            {
              title: 'Установка платежного пароля',
              duration: '5 мин',
              type: 'text',
              content: `Платежный пароль необходим для подтверждения переводов денежных средств, покупок на китайских маркетплейсах и прочих транзакций. Он представляет из себя шестизначный цифровой пароль, который мы советуем записать и надежно сохранить во избежание возможных трудностей с восстановлением в будущем.

Для установки платежного пароля переходим в «настройки», затем «Payment Settings». В открывшейся странице переходим в раздел «Payment Password» и приступаем к установке платежного пароля.

Важно! При установке платежного пароля советуем использовать разные цифры, чтобы не было повторений. Это повысит надежность пароля и минимизирует вероятность, что приложение его не примет.`,
              images: ['https://thb.tildacdn.com/tild3364-3663-4139-b038-313563666338/-/empty/1263.jpg']
            },
            {
              title: 'Добавление электронной почты',
              duration: '5 мин',
              type: 'text',
              content: `Электронная почта поможет дополнительно повысить безопасность аккаунта, а также существенно облегчит восстановление платежного пароля в случае, если вы его забыли.

Для добавления адреса электронной почты переходим в «Настройки», «Account and Security» и переходим в раздел «Email Address».

В открывшемся окне вводим email и нажимаем на кнопку «Get verification code». Вводим код из смс, который придет на указанный ранее номер телефона, нажимаем на кнопку «Next» и видим уведомление, что адрес эл. почты успешно добавлен.`,
              images: [
                'https://thb.tildacdn.com/tild6163-3563-4466-b365-333630653966/-/empty/1264.jpg',
                'https://thb.tildacdn.com/tild3264-3837-4336-a162-643639653039/-/empty/1265.jpg'
              ]
            },
            {
              title: 'Увеличение дневного лимита',
              duration: '10 мин',
              type: 'video',
              content: `Для увеличения дневного лимита Alipay необходимо установить «цифровой сертификат». Для этого переходим в «Настройки», «Account and Security» и переходим в «Security Center».

Затем переходим в раздел "Digital Certificate" и в открывшемся окне нажимаем на кнопку "Install the digital certificate", чтобы приступить к установке сертификата.

Для подтверждения личности, необходимо будет ввести номер загранпаспорта, после чего подтвердить его кодом из смс.

После успешного ввода кода из смс, откроется страница с уведомлением о том, что цифровой сертификат был успешно установлен.`,
              images: [
                'https://thb.tildacdn.com/tild3135-3862-4166-b533-396532623332/-/empty/1280.jpg',
                'https://thb.tildacdn.com/tild3830-3261-4136-a539-393839666264/-/empty/1267.jpg',
                'https://thb.tildacdn.com/tild6231-6639-4538-b666-643835623735/-/empty/1268.jpg',
                'https://thb.tildacdn.com/tild6432-3336-4437-b063-343739373939/-/empty/1269.jpg'
              ]
            },
            {
              title: 'Как включить русский язык',
              duration: '3 мин',
              type: 'text',
              content: `В приложении Alipay для удобства можно установить русский язык. Перевод там не всегда самый точный, но безусловно поможет облегчить использование приложения.

Для установки русского языка переходим в «Настройки», затем «General» и «Language».

Далее выбираем подходящий язык из списка, в нашем случае это русский и нажимаем на кнопку "Save".`,
              images: [
                'https://thb.tildacdn.com/tild3664-6231-4535-b237-363438376466/-/empty/1270.jpg',
                'https://thb.tildacdn.com/tild6638-3034-4263-b338-323061313830/-/empty/1271.jpg'
              ]
            },
            {
              title: 'Восстановление платежного пароля',
              duration: '8 мин',
              type: 'text',
              content: `В случае, если вы забыли свой платежный пароль Alipay или у вас есть необходимость его изменить, это можно сделать через настройки приложения. Для этого переходим в «Настройки», затем «Payment Settings» и «Payment Password».

Изменить его можно двумя методами:

1) Если вы помните платежный пароль - нажмите «Yes», введите текущий пароль, после чего приложение позволит указать новый.

2) Если не помните - нажмите «No», введите код подтверждения из sms, а также номер загранпаспорта для подтверждения личности.

После этого можно будет указать новый платежный пароль и подтвердить его.`,
              images: [
                'https://thb.tildacdn.com/tild6663-3438-4637-a235-653266383839/-/empty/1300.jpg',
                'https://thb.tildacdn.com/tild6338-3666-4262-a635-313537313061/-/empty/1400.jpg',
                'https://thb.tildacdn.com/tild3839-3832-4232-a432-383462303261/-/empty/1500.jpg'
              ]
            },
            {
              title: 'Как работает Alipay',
              duration: '10 мин',
              type: 'video',
              content: `Alipay работает по аналогии, как и любой другой электронный кошелек.

В приложении есть баланс, который нужно пополнить для совершения покупок, либо привязать банковскую карту (карты РФ банков не принимаются).

После пополнения баланса его можно потратить на любом китайском маркетплейсе.

Также можно переводить или «дарить» деньги другим пользователям приложения, что часто бывает очень полезным.

Помимо базовых функций как оплата покупок, переводы денежных средств и общение с другими людьми, приложение также богато другими фишками. Например прямо в Alipay можно добавить трек номера и отслеживать несколько посылок в одном приложении.

Alipay легок в использовании, т.к. в приложении есть встроенный переводчик, а с недавних пор приложение доступно полностью на русском языке.`,
              images: []
            },
            {
              title: 'Как оплачивать через Alipay',
              duration: '12 мин',
              type: 'video',
              content: `В первую очередь, чтобы оплатить покупки с помощью Alipay необходимо, чтобы у вас был положительный баланс на кошельке.

Если с этим пунктом все в порядке, то на примере Poizon остается просто перейти в приложение, выбрать товар, который вы хотите оплатить и нажать на кнопку оплаты. После этого появится меню для выбора способа оплаты: Alipay/Wechat, оплата другом, банковская карта и т.п.

Poizon автоматически определит и привяжет ваш Alipay и все что останется сделать это ввести "платежный пароль" для подтверждения транзакции.`,
              images: []
            },
            {
              title: 'Как вывести деньги с Alipay',
              duration: '8 мин',
              type: 'text',
              content: `Процесс вывода средств с Alipay для россиян немного затруднителен, но возможен. Есть несколько вариантов:

1) Воспользоваться онлайн-обменниками, где вы сможете найти наиболее выгодное по курсу предложение и обменять юани ¥ на рубли.

2) Телеграм-обменники, которые помимо обмена рубли-юани, могут также предоставить и обратный обмен.

3) Обменять ваши юани на рубли в тематических чатах по покупкам в Китае, где людям часто нужны небольшие суммы в юанях.`,
              images: []
            },
            {
              title: 'Перевод денежных средств внутри Alipay',
              duration: '7 мин',
              type: 'text',
              content: `Для перевода денежных средств другим пользователям есть несколько вариантов на выбор:

1) Сканирование qr-кода
Пользователь, которому необходимо перевести средства отправляет вам платежный qr-код, после сканирования которого можно будет перевести средства. Для сканирования на главной странице Alipay нажимаем на кнопку «Scan» в левом верхнем углу.

2) Перевод по номеру телефона
Для перевода по номеру телефона переходим в раздел «Pay/Receive» по кнопке в верхней части экрана, затем «Transfer». Далее нажимаем на кнопку «Transfer to Alipay», вводим номер телефона пользователя в формате «7-123456789» и нажимаем «Confirm».`,
              images: [
                'https://thb.tildacdn.com/tild6138-3361-4238-b531-613935656331/-/empty/1501.jpg',
                'https://thb.tildacdn.com/tild3237-3232-4666-b535-323634373661/-/empty/1502.jpg',
                'https://thb.tildacdn.com/tild3764-6562-4937-a562-346530316534/-/empty/1503.jpg'
              ]
            },
            {
              title: 'Как получать деньги от других пользователей',
              duration: '5 мин',
              type: 'text',
              content: `Пользователи могут отправить вам денежные средства по номеру телефона в формате «7-123456789», либо по «платежному qr-коду», который вы можете им отправить.

Для этого переходим в раздел «Pay/Receive», затем нажимаем на кнопку «Receive». В открывшемся разделе будет «qr-код», отсканировав который пользователи смогут отправлять вам средства на баланс Alipay.

Для перевода можно отправить как скриншот, так и сохраненное изображение «qr-кода» по кнопке «Save Picture».

Также можно настроить конкретную сумму, которую вы хотите, чтобы вам перевели. Для этого нажимаем на кнопку «Specify Amount».`,
              images: [
                'https://thb.tildacdn.com/tild6561-6364-4134-b938-656336653833/-/empty/1506.jpg',
                'https://thb.tildacdn.com/tild6163-6535-4431-a332-663439393134/-/empty/1507.jpg',
                'https://thb.tildacdn.com/tild3965-3462-4961-a531-623562333232/-/empty/1508.jpg'
              ]
            },
            {
              title: 'Лимиты и ограничения Alipay',
              duration: '10 мин',
              type: 'tool',
              content: `Для иностранных пользователей платформа открывает широкие возможности, но важно учитывать лимиты:

Неверифицированный аккаунт:
• Разовое пополнение: до 1 000 юаней
• Дневной лимит: до 2 000 юаней

Верифицированный аккаунт:
• Разовый платеж: до 50 000 юаней
• Годовой лимит: до 200 000 юаней

Чтобы проверить свои лимиты, откройте приложение Alipay, перейдите в раздел настроек и выберите соответствующую опцию.

Для увеличения лимитов необходимо:
1) Загрузить скан загранпаспорта
2) Указать актуальные контактные данные
3) Привязать международную банковскую карту

В некоторых случаях может потребоваться предоставление дополнительной информации, такой как подтверждение адреса проживания или банковские выписки.`,
              images: []
            }
          ];

          for (let i = 0; i < lessons.length; i++) {
            const lesson = lessons[i];
            const lessonResult = await client.queryObject`
              INSERT INTO lessons (course_id, title, content, duration, type, order_index)
              VALUES (${courseId}, ${lesson.title}, ${lesson.content}, ${lesson.duration}, ${lesson.type}, ${i + 1})
              RETURNING id
            `;
            
            const lessonId = (lessonResult.rows[0] as { id: number }).id;
            
            // Add images
            for (let j = 0; j < lesson.images.length; j++) {
              await client.queryObject`
                INSERT INTO lesson_images (lesson_id, image_url, order_index)
                VALUES (${lessonId}, ${lesson.images[j]}, ${j + 1})
              `;
            }
          }

          return new Response(JSON.stringify({ success: true, message: 'Alipay content seeded successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        default:
          return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }
    } finally {
      if (client) {
        await client.end();
      }
    }
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
