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

  const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
  
  const client = new Client({
    hostname: host,
    port: parseInt(port),
    user: user,
    password: password,
    database: dbname,
    tls: {
      enabled: false,
    },
  });
  
  await client.connect();
  return client;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    let client;

    try {
      client = await getDbConnection();

      switch (action) {
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

        case 'get_courses': {
          const result = await client.queryObject`
            SELECT * FROM courses ORDER BY id
          `;
          return new Response(JSON.stringify({ success: true, courses: result.rows }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'get_course_by_slug': {
          const result = await client.queryObject`
            SELECT * FROM courses WHERE slug = ${data.slug}
          `;
          return new Response(JSON.stringify({ success: true, course: result.rows[0] || null }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'get_lessons': {
          const result = await client.queryObject`
            SELECT * FROM lessons WHERE course_id = ${data.course_id} ORDER BY order_index
          `;
          return new Response(JSON.stringify({ success: true, lessons: result.rows }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'get_lessons_by_course_slug': {
          // First get course
          const courseResult = await client.queryObject`
            SELECT id FROM courses WHERE slug = ${data.slug}
          `;
          if (courseResult.rows.length === 0) {
            return new Response(JSON.stringify({ success: true, lessons: [] }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          const courseId = (courseResult.rows[0] as { id: number }).id;
          
          const result = await client.queryObject`
            SELECT * FROM lessons WHERE course_id = ${courseId} ORDER BY order_index
          `;
          return new Response(JSON.stringify({ success: true, lessons: result.rows }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'get_lesson_content': {
          const result = await client.queryObject`
            SELECT * FROM lessons WHERE id = ${data.lesson_id}
          `;
          const lesson = result.rows[0];
          
          if (!lesson) {
            return new Response(JSON.stringify({ success: true, lesson: null, images: [] }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          const imagesResult = await client.queryObject`
            SELECT * FROM lesson_images WHERE lesson_id = ${data.lesson_id} ORDER BY order_index
          `;
          
          return new Response(JSON.stringify({ 
            success: true, 
            lesson: lesson,
            images: imagesResult.rows 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'get_lesson_by_course_and_order': {
          // Get lesson by course slug and order_index
          const courseResult = await client.queryObject`
            SELECT id FROM courses WHERE slug = ${data.course_slug}
          `;
          if (courseResult.rows.length === 0) {
            return new Response(JSON.stringify({ success: true, lesson: null, images: [] }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          const courseId = (courseResult.rows[0] as { id: number }).id;
          
          const lessonResult = await client.queryObject`
            SELECT * FROM lessons WHERE course_id = ${courseId} AND order_index = ${data.order_index}
          `;
          const lesson = lessonResult.rows[0];
          
          if (!lesson) {
            return new Response(JSON.stringify({ success: true, lesson: null, images: [] }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          const lessonId = (lesson as { id: number }).id;
          const imagesResult = await client.queryObject`
            SELECT * FROM lesson_images WHERE lesson_id = ${lessonId} ORDER BY order_index
          `;
          
          return new Response(JSON.stringify({ 
            success: true, 
            lesson: lesson,
            images: imagesResult.rows 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'save_course': {
          const { slug, title, description, emoji } = data;
          const existing = await client.queryObject`
            SELECT id FROM courses WHERE slug = ${slug}
          `;
          
          if (existing.rows.length > 0) {
            await client.queryObject`
              UPDATE courses SET title = ${title}, description = ${description}, emoji = ${emoji}, updated_at = NOW()
              WHERE slug = ${slug}
            `;
            return new Response(JSON.stringify({ success: true, id: (existing.rows[0] as { id: number }).id }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            const result = await client.queryObject`
              INSERT INTO courses (slug, title, description, emoji)
              VALUES (${slug}, ${title}, ${description}, ${emoji})
              RETURNING id
            `;
            return new Response(JSON.stringify({ success: true, id: (result.rows[0] as { id: number }).id }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        case 'save_lesson': {
          const { course_id, title, content, duration, type, order_index } = data;
          
          // Check if lesson with this course_id and order_index exists
          const existing = await client.queryObject`
            SELECT id FROM lessons WHERE course_id = ${course_id} AND order_index = ${order_index}
          `;
          
          if (existing.rows.length > 0) {
            await client.queryObject`
              UPDATE lessons SET title = ${title}, content = ${content}, duration = ${duration}, type = ${type}, updated_at = NOW()
              WHERE course_id = ${course_id} AND order_index = ${order_index}
            `;
            return new Response(JSON.stringify({ success: true, id: (existing.rows[0] as { id: number }).id }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            const result = await client.queryObject`
              INSERT INTO lessons (course_id, title, content, duration, type, order_index)
              VALUES (${course_id}, ${title}, ${content}, ${duration}, ${type}, ${order_index})
              RETURNING id
            `;
            return new Response(JSON.stringify({ success: true, id: (result.rows[0] as { id: number }).id }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        case 'save_lesson_image': {
          const { lesson_id, image_url, caption, order_index } = data;
          
          // Check if image with this lesson_id and order_index exists
          const existing = await client.queryObject`
            SELECT id FROM lesson_images WHERE lesson_id = ${lesson_id} AND order_index = ${order_index}
          `;
          
          if (existing.rows.length > 0) {
            await client.queryObject`
              UPDATE lesson_images SET image_url = ${image_url}, caption = ${caption}
              WHERE lesson_id = ${lesson_id} AND order_index = ${order_index}
            `;
            return new Response(JSON.stringify({ success: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            await client.queryObject`
              INSERT INTO lesson_images (lesson_id, image_url, caption, order_index)
              VALUES (${lesson_id}, ${image_url}, ${caption || ''}, ${order_index || 0})
            `;
            return new Response(JSON.stringify({ success: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        case 'clear_all': {
          await client.queryObject`DELETE FROM lesson_images`;
          await client.queryObject`DELETE FROM lessons`;
          await client.queryObject`DELETE FROM courses`;
          return new Response(JSON.stringify({ success: true, message: 'All data cleared' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'migrate_data': {
          // Receive all data and insert it
          const { courses, lessons, images } = data;
          
          // Insert courses
          const courseIdMap: Record<string, number> = {};
          for (const course of courses) {
            const result = await client.queryObject`
              INSERT INTO courses (slug, title, description, emoji)
              VALUES (${course.slug}, ${course.title}, ${course.description}, ${course.emoji})
              ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, emoji = EXCLUDED.emoji
              RETURNING id
            `;
            courseIdMap[course.slug] = (result.rows[0] as { id: number }).id;
          }
          
          // Insert lessons
          const lessonIdMap: Record<string, number> = {};
          for (const lesson of lessons) {
            const courseId = courseIdMap[lesson.course_slug];
            if (!courseId) continue;
            
            const result = await client.queryObject`
              INSERT INTO lessons (course_id, title, content, duration, type, order_index)
              VALUES (${courseId}, ${lesson.title}, ${lesson.content}, ${lesson.duration}, ${lesson.type}, ${lesson.order_index})
              RETURNING id
            `;
            // Map old lesson id to new one
            lessonIdMap[lesson.old_id] = (result.rows[0] as { id: number }).id;
          }
          
          // Insert images
          for (const image of images) {
            const lessonId = lessonIdMap[image.old_lesson_id];
            if (!lessonId) continue;
            
            await client.queryObject`
              INSERT INTO lesson_images (lesson_id, image_url, caption, order_index)
              VALUES (${lessonId}, ${image.image_url}, ${image.caption || ''}, ${image.order_index || 0})
            `;
          }
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: `Migrated ${courses.length} courses, ${lessons.length} lessons, ${images.length} images`,
            courseIdMap,
            lessonIdMap
          }), {
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
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
