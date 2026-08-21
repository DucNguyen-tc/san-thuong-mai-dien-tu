--
-- PostgreSQL database dump
--

\restrict VYaWPsQX2wi2EEgO9oa3g1nEI5o5F1amXt98SgPDkIFTxuEsgKOV9MRa9bST6NI

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg12+1)
-- Dumped by pg_dump version 18.0

-- Started on 2026-08-21 10:55:40

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
-- TOC entry 844 (class 1247 OID 18065)
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'VNPAY',
    'MOMO',
    'CASH'
);


ALTER TYPE public."PaymentMethod" OWNER TO admin;

--
-- TOC entry 847 (class 1247 OID 18072)
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 18055)
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
-- TOC entry 216 (class 1259 OID 18081)
-- Name: payments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    amount numeric(12,0) NOT NULL,
    method public."PaymentMethod" NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    gateway_transaction_id character varying(100),
    payment_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payments OWNER TO admin;

--
-- TOC entry 3366 (class 0 OID 18055)
-- Dependencies: 215
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
01012ed8-fe96-479f-ae12-1cbaba8ff344	e7ec14925d80bb5d68ad16a3d2f2d00c2b29431f75fd4a842779dbaed4445d71	2026-07-10 16:21:17.706738+00	20260710153202_init_payment_schema	\N	\N	2026-07-10 16:21:17.690795+00	1
\.


--
-- TOC entry 3367 (class 0 OID 18081)
-- Dependencies: 216
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.payments (id, order_id, amount, method, status, gateway_transaction_id, payment_url, created_at, updated_at) FROM stdin;
608df22e-333f-494c-b39d-a0923839e67b	52ff283f-2c0b-4bd0-bcb6-7c255adbc49e	204750	MOMO	FAILED	1787235222378	https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT3w1MmZmMjgzZi0yYzBiLTRiZDAtYmNiNi03YzI1NWFkYmM0OWU&s=b654cb6a2d8f81f0891a65597e98f7f09e2bb12650ba928115a14930e43ba4fa	2026-08-20 14:13:35.335+00	2026-08-20 14:13:45.68+00
41f2e268-fc11-4d9a-a3c4-94fcbd27a239	d5fddb76-20ca-4d86-bf81-d770118e147a	129750	MOMO	FAILED	1787235298188	https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT3xkNWZkZGI3Ni0yMGNhLTRkODYtYmY4MS1kNzcwMTE4ZTE0N2E&s=8fb2d55145e1a0db9655cc95776c5ab3fa3f57ffa261236bb4a20df0009b10e4	2026-08-20 14:14:53.33+00	2026-08-20 14:15:01.257+00
67708caa-ac38-4959-b5f9-b40d6494d7b4	d1b34901-12ce-4aea-a764-33b5f69348b9	279750	CASH	FAILED	\N	\N	2026-08-20 15:22:10.292+00	2026-08-20 15:22:18.984+00
aa9df155-d92c-4aa4-a747-15de1f80b88d	db72ea5c-2577-48f9-af7f-836fb397ad8e	3249750	CASH	PENDING	\N	\N	2026-08-13 15:37:12.435+00	2026-08-13 15:37:12.435+00
8014b6cc-d196-45f4-b2ef-11081bc39058	94d74706-3206-41d7-b128-a7f11f165116	254750	CASH	PENDING	\N	\N	2026-08-13 15:37:32.945+00	2026-08-13 15:37:32.945+00
d4e0fd46-5589-4852-a812-3c18a2f54730	e6e2acd2-554f-4d68-9b3f-488d53c9b2a4	6374788	CASH	PENDING	\N	\N	2026-08-13 15:37:53.051+00	2026-08-13 15:37:53.051+00
53dacec9-2fae-4336-8936-53745f621065	138f9303-1f24-49c8-9174-46967e04d25b	999500	CASH	PENDING	\N	\N	2026-08-13 15:38:02.499+00	2026-08-13 15:38:02.499+00
df0f9396-bb2f-4f9c-9ae7-78c75451641e	85f7acc4-e3ba-4e54-9a73-61dd107fd59c	2123750	CASH	PENDING	\N	\N	2026-08-13 15:38:12.797+00	2026-08-13 15:38:12.797+00
4cdf66a0-92ad-49c4-b9c1-533cadcd2526	f9a1291f-e8c6-4151-b34e-3858b44a9038	204750	CASH	PENDING	\N	\N	2026-08-20 14:10:29.626+00	2026-08-20 14:10:29.626+00
de83ee4e-d2a4-452c-9b1d-2133c7b6f27f	583741e2-a945-4e34-a510-d505eb5af896	404750	VNPAY	SUCCESS	15663140	https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=40475000&vnp_Command=pay&vnp_CreateDate=20260821041129&vnp_CurrCode=VND&vnp_IpAddr=%3A%3A1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+583741e2-a945-4e34-a510-d505eb5af896&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fpayments%2Fvnpay%2Freturn&vnp_TmnCode=6IV5JGE0&vnp_TxnRef=583741e2-a945-4e34-a510-d505eb5af896&vnp_Version=2.1.0&vnp_SecureHash=116d78649a38ec236842a1a320044ff40f7ca19f24007f8820dc35f5c06126716d62d9ece01d526f2d4046e62d283ed9be00abf854fabb982fcb42cdd7f9a8e0	2026-08-20 14:11:29.41+00	2026-08-20 14:12:18.995+00
\.


--
-- TOC entry 3219 (class 2606 OID 18063)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3222 (class 2606 OID 18091)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3220 (class 1259 OID 18092)
-- Name: payments_order_id_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX payments_order_id_key ON public.payments USING btree (order_id);


-- Completed on 2026-08-21 10:55:40

--
-- PostgreSQL database dump complete
--

\unrestrict VYaWPsQX2wi2EEgO9oa3g1nEI5o5F1amXt98SgPDkIFTxuEsgKOV9MRa9bST6NI

