--
-- PostgreSQL database dump
--

\restrict Yu60oC5hJ4hnGqO85NQQrqdglSMkZDBkS3iaJqqRs7UVAxHdLbTjvstVkWdJemE

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg12+1)
-- Dumped by pg_dump version 18.0

-- Started on 2026-08-21 10:55:17

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
-- TOC entry 846 (class 1247 OID 17875)
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING_PAYMENT',
    'CONFIRMED',
    'SHIPPING',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO admin;

--
-- TOC entry 849 (class 1247 OID 17886)
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'VNPAY',
    'MOMO',
    'CASH'
);


ALTER TYPE public."PaymentMethod" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 17865)
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
-- TOC entry 218 (class 1259 OID 17907)
-- Name: order_items; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.order_items (
    id bigint NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid NOT NULL,
    product_name_snapshot character varying(255) NOT NULL,
    variant_attributes_snapshot jsonb NOT NULL,
    original_unit_price numeric(12,0) NOT NULL,
    unit_price_snapshot numeric(12,0) NOT NULL,
    quantity integer NOT NULL,
    line_total numeric(12,0) NOT NULL,
    product_image_snapshot text,
    CONSTRAINT check_order_item_quantity CHECK ((quantity > 0))
);


ALTER TABLE public.order_items OWNER TO admin;

--
-- TOC entry 217 (class 1259 OID 17906)
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO admin;

--
-- TOC entry 3388 (class 0 OID 0)
-- Dependencies: 217
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- TOC entry 216 (class 1259 OID 17893)
-- Name: orders; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING_PAYMENT'::public."OrderStatus" NOT NULL,
    shipping_address text NOT NULL,
    payment_method public."PaymentMethod" NOT NULL,
    subtotal numeric(12,0) NOT NULL,
    discount_amount numeric(12,0) DEFAULT 0 NOT NULL,
    shipping_fee numeric(12,0) DEFAULT 0 NOT NULL,
    total_amount numeric(12,0) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.orders OWNER TO admin;

--
-- TOC entry 3225 (class 2604 OID 17910)
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- TOC entry 3379 (class 0 OID 17865)
-- Dependencies: 215
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b77ab24f-31e5-431e-9ed2-0265271702cc	2c339d47b191ae9bdc069dff4771b6b55becdc85da92c28cbc9f04b72a5bfadf	2026-07-10 16:20:59.721392+00	20260710152849_init_order_schema	\N	\N	2026-07-10 16:20:59.6942+00	1
\.


--
-- TOC entry 3382 (class 0 OID 17907)
-- Dependencies: 218
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.order_items (id, order_id, product_id, variant_id, product_name_snapshot, variant_attributes_snapshot, original_unit_price, unit_price_snapshot, quantity, line_total, product_image_snapshot) FROM stdin;
46	db72ea5c-2577-48f9-af7f-836fb397ad8e	b844d7d6-6857-4757-b2ab-4a83c28fb0bb	0232a647-97c2-4969-af73-11b29ee888f2	Women's Wrist Watch	{"default": true}	3249750	3249750	1	3249750	https://cdn.dummyjson.com/product-images/womens-watches/women's-wrist-watch/1.webp
47	94d74706-3206-41d7-b128-a7f11f165116	a29de217-48b7-4c04-a647-8643332f127e	97272099-3385-4ffc-95f6-df375c7ea561	Baseball Ball	{"default": true}	224750	224750	1	224750	https://cdn.dummyjson.com/product-images/sports-accessories/baseball-ball/1.webp
48	e6e2acd2-554f-4d68-9b3f-488d53c9b2a4	74388d4f-412c-4cca-9cd7-67ebbc89487b	12892402-ec84-426d-81fc-e783e2cb5bc9	Vivo V9	{"default": true}	6374788	6374788	1	6374788	https://cdn.dummyjson.com/product-images/smartphones/vivo-v9/1.webp
49	138f9303-1f24-49c8-9174-46967e04d25b	6ec139c9-c696-4c2e-b774-d949977044d7	678416eb-c7b8-4d30-b304-4a269cba400d	Spice Rack	{"default": true}	499750	499750	2	999500	https://cdn.dummyjson.com/product-images/kitchen-accessories/spice-rack/1.webp
50	85f7acc4-e3ba-4e54-9a73-61dd107fd59c	22889105-d114-4aef-8085-cb993429ac6a	e4f10c49-8d58-41d4-a2c9-01013e23abae	Tray	{"default": true}	424750	424750	5	2123750	https://cdn.dummyjson.com/product-images/kitchen-accessories/tray/1.webp
51	f9a1291f-e8c6-4151-b34e-3858b44a9038	7e0c6df8-0893-4a02-b7b6-6cdfef1b6207	8139ba58-4404-4f4f-a643-4bc40d9763ce	Red Tongs	{"default": true}	174750	174750	1	174750	https://cdn.dummyjson.com/product-images/kitchen-accessories/red-tongs/1.webp
52	583741e2-a945-4e34-a510-d505eb5af896	2b1a2223-9624-4191-85ed-d60f4760c7ba	c2083bc4-8b9c-4705-92b0-1ede657fb678	Knife	{"default": true}	374750	374750	1	374750	https://cdn.dummyjson.com/product-images/kitchen-accessories/knife/1.webp
53	52ff283f-2c0b-4bd0-bcb6-7c255adbc49e	02e69510-1c4a-449f-9441-c77c94340021	a2208d73-85f2-4604-828b-a1d972d64c5f	Egg Slicer	{"default": true}	174750	174750	1	174750	https://cdn.dummyjson.com/product-images/kitchen-accessories/egg-slicer/1.webp
54	d5fddb76-20ca-4d86-bf81-d770118e147a	b36dd01f-c8b4-4d11-8686-47f216020a48	1055efd5-14cd-47b1-b765-8b7e876e375b	Plate	{"default": true}	99750	99750	1	99750	https://cdn.dummyjson.com/product-images/kitchen-accessories/plate/1.webp
55	84b49047-7605-4c37-87ff-b946f19d29b7	3365af85-a6f9-4344-a77c-78ef7b9d4563	f2a56615-102b-403c-b9e2-4af63c55aff2	Iron Golf	{"default": true}	1249750	1249750	1	1249750	https://cdn.dummyjson.com/product-images/sports-accessories/iron-golf/1.webp
56	3515b98f-6b84-4a6f-950e-bc9c0001d05d	3365af85-a6f9-4344-a77c-78ef7b9d4563	f2a56615-102b-403c-b9e2-4af63c55aff2	Iron Golf	{"default": true}	1249750	1249750	1	1249750	https://cdn.dummyjson.com/product-images/sports-accessories/iron-golf/1.webp
57	ecf4bb53-ec4a-4947-9418-3585c0d688b6	3f06361c-167d-4352-bbf3-7a9dceb4c2a3	efaa9065-47f6-4387-b4e7-d6fccaba1822	Golf Ball	{"default": true}	249750	249750	1	249750	https://cdn.dummyjson.com/product-images/sports-accessories/golf-ball/1.webp
58	5a040a66-b69a-4194-908f-f8103a7c7c6d	3f06361c-167d-4352-bbf3-7a9dceb4c2a3	efaa9065-47f6-4387-b4e7-d6fccaba1822	Golf Ball	{"default": true}	249750	249750	1	249750	https://cdn.dummyjson.com/product-images/sports-accessories/golf-ball/1.webp
59	d1b34901-12ce-4aea-a764-33b5f69348b9	3f06361c-167d-4352-bbf3-7a9dceb4c2a3	efaa9065-47f6-4387-b4e7-d6fccaba1822	Golf Ball	{"default": true}	249750	249750	1	249750	https://cdn.dummyjson.com/product-images/sports-accessories/golf-ball/1.webp
\.


--
-- TOC entry 3380 (class 0 OID 17893)
-- Dependencies: 216
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.orders (id, customer_id, status, shipping_address, payment_method, subtotal, discount_amount, shipping_fee, total_amount, created_at, updated_at) FROM stdin;
db72ea5c-2577-48f9-af7f-836fb397ad8e	8e975083-79d9-4226-b4b0-09c6630d5441	CONFIRMED	Nguyễn Văn A - 0123456789 - 97 Man Thiện, phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh	CASH	3249750	0	0	3249750	2026-08-13 15:37:12.163+00	2026-08-13 15:37:12.163+00
94d74706-3206-41d7-b128-a7f11f165116	8e975083-79d9-4226-b4b0-09c6630d5441	CONFIRMED	Nguyễn Văn A - 0123456789 - 97 Man Thiện, phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh	CASH	224750	0	30000	254750	2026-08-13 15:37:32.918+00	2026-08-13 15:37:32.918+00
e6e2acd2-554f-4d68-9b3f-488d53c9b2a4	8e975083-79d9-4226-b4b0-09c6630d5441	CONFIRMED	Nguyễn Văn A - 0123456789 - 97 Man Thiện, phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh	CASH	6374788	0	0	6374788	2026-08-13 15:37:53.02+00	2026-08-13 15:37:53.02+00
138f9303-1f24-49c8-9174-46967e04d25b	8e975083-79d9-4226-b4b0-09c6630d5441	CONFIRMED	Nguyễn Văn A - 0123456789 - 97 Man Thiện, phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh	CASH	999500	0	0	999500	2026-08-13 15:38:02.467+00	2026-08-13 15:38:02.467+00
85f7acc4-e3ba-4e54-9a73-61dd107fd59c	8e975083-79d9-4226-b4b0-09c6630d5441	CONFIRMED	Nguyễn Văn A - 0123456789 - 97 Man Thiện, phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh	CASH	2123750	0	0	2123750	2026-08-13 15:38:12.767+00	2026-08-13 15:38:12.767+00
f9a1291f-e8c6-4151-b34e-3858b44a9038	2d5c3cdc-8a53-4ddc-a09e-571df4d3c1a3	CONFIRMED	Ho Minh Kho - 09982554585 - 97 Man Thiện	CASH	174750	0	30000	204750	2026-08-20 14:10:29.314+00	2026-08-20 14:10:29.314+00
52ff283f-2c0b-4bd0-bcb6-7c255adbc49e	2d5c3cdc-8a53-4ddc-a09e-571df4d3c1a3	CANCELLED	Ho Minh Kho - 09982554585 - 97 Man Thiện	MOMO	174750	0	30000	204750	2026-08-20 14:13:34.688+00	2026-08-20 14:13:45.71+00
d5fddb76-20ca-4d86-bf81-d770118e147a	2d5c3cdc-8a53-4ddc-a09e-571df4d3c1a3	CANCELLED	Ho Minh Kho - 09982554585 - 97 Man Thiện	MOMO	99750	0	30000	129750	2026-08-20 14:14:52.781+00	2026-08-20 14:15:01.288+00
84b49047-7605-4c37-87ff-b946f19d29b7	8e975083-79d9-4226-b4b0-09c6630d5441	CANCELLED	Nguyễn Văn A - 0123456789 - 97 Man Thiện, phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh	CASH	1249750	0	0	1249750	2026-08-20 15:11:35.759+00	2026-08-20 15:11:35.838+00
3515b98f-6b84-4a6f-950e-bc9c0001d05d	8e975083-79d9-4226-b4b0-09c6630d5441	CANCELLED	Nguyễn Văn A - 0123456789 - 97 Man Thiện, phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh	CASH	1249750	0	0	1249750	2026-08-20 15:17:06.57+00	2026-08-20 15:17:06.626+00
ecf4bb53-ec4a-4947-9418-3585c0d688b6	2d5c3cdc-8a53-4ddc-a09e-571df4d3c1a3	CANCELLED	Ho Minh Kho - 09982554585 - 97 Man Thiện	MOMO	249750	0	30000	279750	2026-08-20 15:18:19.136+00	2026-08-20 15:18:19.168+00
5a040a66-b69a-4194-908f-f8103a7c7c6d	2d5c3cdc-8a53-4ddc-a09e-571df4d3c1a3	CANCELLED	Ho Minh Kho - 09982554585 - 97 Man Thiện	MOMO	249750	0	30000	279750	2026-08-20 15:18:20.308+00	2026-08-20 15:18:20.339+00
d1b34901-12ce-4aea-a764-33b5f69348b9	2d5c3cdc-8a53-4ddc-a09e-571df4d3c1a3	CANCELLED	Ho Minh Kho - 09982554585 - 97 Man Thiện	CASH	249750	0	30000	279750	2026-08-20 15:22:10.187+00	2026-08-20 15:22:18.992+00
583741e2-a945-4e34-a510-d505eb5af896	2d5c3cdc-8a53-4ddc-a09e-571df4d3c1a3	COMPLETED	Ho Minh Kho - 09982554585 - 97 Man Thiện	VNPAY	374750	0	30000	404750	2026-08-20 14:11:29.378+00	2026-08-20 15:31:59.389+00
\.


--
-- TOC entry 3389 (class 0 OID 0)
-- Dependencies: 217
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.order_items_id_seq', 59, true);


--
-- TOC entry 3228 (class 2606 OID 17873)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3234 (class 2606 OID 17914)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3232 (class 2606 OID 17905)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3229 (class 1259 OID 17915)
-- Name: idx_orders_customer_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_orders_customer_id ON public.orders USING btree (customer_id);


--
-- TOC entry 3230 (class 1259 OID 17916)
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- TOC entry 3235 (class 2606 OID 17917)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2026-08-21 10:55:17

--
-- PostgreSQL database dump complete
--

\unrestrict Yu60oC5hJ4hnGqO85NQQrqdglSMkZDBkS3iaJqqRs7UVAxHdLbTjvstVkWdJemE

