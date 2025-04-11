CREATE TABLE "hello_world" (
	"id" serial PRIMARY KEY NOT NULL,
	"hello_world" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"modified_at" timestamp with time zone DEFAULT now()
);
