--
-- PostgreSQL database dump
--

\restrict NNdcDD4RYMMu1iFXJgVdY8c8zrPfD91356m6hcNhNA2vHlHfxDJlZwTrcy61AKt

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg12+1)
-- Dumped by pg_dump version 18.0

-- Started on 2026-08-21 10:51:52

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 846 (class 1247 OID 16440)
-- Name: CartStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."CartStatus" AS ENUM (
    'ACTIVE',
    'CHECKED_OUT'
);


ALTER TYPE public."CartStatus" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 16430)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO admin;

--
-- TOC entry 218 (class 1259 OID 16455)
-- Name: cart_items; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cart_items (
    id bigint NOT NULL,
    cart_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid NOT NULL,
    product_name_snapshot character varying(255) NOT NULL,
    variant_attributes_snapshot jsonb NOT NULL,
    unit_price_snapshot numeric(12,0) NOT NULL,
    quantity integer NOT NULL,
    added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_cart_item_quantity CHECK ((quantity > 0))
);


ALTER TABLE public.cart_items OWNER TO admin;

--
-- TOC entry 217 (class 1259 OID 16454)
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.cart_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_items_id_seq OWNER TO admin;

--
-- TOC entry 3384 (class 0 OID 0)
-- Dependencies: 217
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- TOC entry 216 (class 1259 OID 16445)
-- Name: carts; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    status public."CartStatus" DEFAULT 'ACTIVE'::public."CartStatus" NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.carts OWNER TO admin;

--
-- TOC entry 3220 (class 2604 OID 16458)
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- TOC entry 3375 (class 0 OID 16430)
-- Dependencies: 215
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d6b5abd7-3862-4932-a264-eb28433b58e5	2066eca0e3cadc7f58894ee9a6ad316993bc2d236af11d134381a1f7f852959c	2026-07-10 16:18:38.284604+00	20260710152553_init_cart_schema	\N	\N	2026-07-10 16:18:38.256648+00	1
\.


--
-- TOC entry 3378 (class 0 OID 16455)
-- Dependencies: 218
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.cart_items (id, cart_id, product_id, variant_id, product_name_snapshot, variant_attributes_snapshot, unit_price_snapshot, quantity, added_at) FROM stdin;
58	27e543cf-8279-4d4d-959a-4b30d577129e	b844d7d6-6857-4757-b2ab-4a83c28fb0bb	0232a647-97c2-4969-af73-11b29ee888f2	Women's Wrist Watch	{"default": true}	3249750	1	2026-08-10 13:43:12.731+00
62	331b6184-f321-4582-899d-16a22695a4ee	841f60c5-c5d5-453b-904a-7f12b0d4ca48	d3640b1c-c5ff-4809-a1db-79e9aa60add5	Blue Frock	{"default": true}	749750	1	2026-08-11 15:41:05.775+00
72	e6034a1d-695d-42d3-928f-be80095509c3	3365af85-a6f9-4344-a77c-78ef7b9d4563	f2a56615-102b-403c-b9e2-4af63c55aff2	Iron Golf	{"default": true}	1249750	1	2026-08-20 15:11:34.453+00
48	c0627e98-dc3c-491b-977f-0bdc4baaee5f	22b3a345-367f-4f51-bf45-b644064151f1	fd6468ac-9de0-4908-bcc2-04f63874fc1f	Garmin Fenix 7 Sapphire Solar	{"color": "Đen Titan"}	22490000	1	2026-08-02 14:12:07.021+00
\.


--
-- TOC entry 3376 (class 0 OID 16445)
-- Dependencies: 216
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.carts (id, customer_id, status, created_at, updated_at) FROM stdin;
e6034a1d-695d-42d3-928f-be80095509c3	8e975083-79d9-4226-b4b0-09c6630d5441	ACTIVE	2026-07-17 04:17:01.519+00	2026-07-17 04:17:01.519+00
331b6184-f321-4582-899d-16a22695a4ee	63570767-5f75-4526-8c2e-a324899b9919	ACTIVE	2026-07-28 09:02:44.424+00	2026-07-28 09:02:44.424+00
c0627e98-dc3c-491b-977f-0bdc4baaee5f	58a6411d-12b0-49e7-b6a0-f1ade8a72ea1	ACTIVE	2026-08-02 14:10:56.004+00	2026-08-02 14:10:56.004+00
19912595-1d5c-47fa-93b4-adea4a19e7da	a538a9d1-e028-4cd8-a316-8010216a88f1	ACTIVE	2026-08-02 15:27:36.239+00	2026-08-02 15:27:36.239+00
d0516fa4-6c62-4eb0-a382-1a9ca3743cb1	2d5c3cdc-8a53-4ddc-a09e-571df4d3c1a3	ACTIVE	2026-08-10 08:42:24.231+00	2026-08-10 08:42:24.231+00
27e543cf-8279-4d4d-959a-4b30d577129e	ba6e855f-3db9-4d54-899f-772edfd2c28c	ACTIVE	2026-08-10 13:38:58.17+00	2026-08-10 13:38:58.17+00
\.


--
-- TOC entry 3385 (class 0 OID 0)
-- Dependencies: 217
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 73, true);


--
-- TOC entry 3224 (class 2606 OID 16438)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3230 (class 2606 OID 16463)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3226 (class 2606 OID 16453)
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- TOC entry 3228 (class 1259 OID 16464)
-- Name: cart_items_cart_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX cart_items_cart_id_idx ON public.cart_items USING btree (cart_id);


--
-- TOC entry 3227 (class 1259 OID 16470)
-- Name: uq_active_cart_per_customer; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX uq_active_cart_per_customer ON public.carts USING btree (customer_id) WHERE (status = 'ACTIVE'::public."CartStatus");


--
-- TOC entry 3231 (class 2606 OID 16465)
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2026-08-21 10:51:52

--
-- PostgreSQL database dump complete
--

\unrestrict NNdcDD4RYMMu1iFXJgVdY8c8zrPfD91356m6hcNhNA2vHlHfxDJlZwTrcy61AKt

