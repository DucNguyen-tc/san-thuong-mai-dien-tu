--
-- PostgreSQL database dump
--

\restrict sCBbfjd0wW8wtJuAiNHwj0ejsmL8qnRDUzw1Oijuj5Bf3vow7OWSRsYncXaXR7t

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg12+1)
-- Dumped by pg_dump version 18.0

-- Started on 2026-08-21 10:44:56

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
-- TOC entry 851 (class 1247 OID 17486)
-- Name: AuthProvider; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."AuthProvider" AS ENUM (
    'LOCAL',
    'GOOGLE'
);


ALTER TYPE public."AuthProvider" OWNER TO admin;

--
-- TOC entry 848 (class 1247 OID 17481)
-- Name: Role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."Role" AS ENUM (
    'CUSTOMER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 17471)
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
-- TOC entry 220 (class 1259 OID 17516)
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.refresh_tokens (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO admin;

--
-- TOC entry 219 (class 1259 OID 17515)
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO admin;

--
-- TOC entry 3403 (class 0 OID 0)
-- Dependencies: 219
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- TOC entry 218 (class 1259 OID 17505)
-- Name: user_addresses; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_addresses (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    receiver_name character varying(150),
    phone character varying(20),
    address_line text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_addresses OWNER TO admin;

--
-- TOC entry 217 (class 1259 OID 17504)
-- Name: user_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.user_addresses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_addresses_id_seq OWNER TO admin;

--
-- TOC entry 3404 (class 0 OID 0)
-- Dependencies: 217
-- Name: user_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.user_addresses_id_seq OWNED BY public.user_addresses.id;


--
-- TOC entry 216 (class 1259 OID 17491)
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    full_name character varying(150) NOT NULL,
    phone character varying(20),
    avatar_url text,
    role public."Role" DEFAULT 'CUSTOMER'::public."Role" NOT NULL,
    auth_provider public."AuthProvider" DEFAULT 'LOCAL'::public."AuthProvider" NOT NULL,
    google_id character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO admin;

--
-- TOC entry 3233 (class 2604 OID 17519)
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- TOC entry 3230 (class 2604 OID 17508)
-- Name: user_addresses id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_addresses ALTER COLUMN id SET DEFAULT nextval('public.user_addresses_id_seq'::regclass);


--
-- TOC entry 3392 (class 0 OID 17471)
-- Dependencies: 215
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f1a31d99-646e-4224-9a2e-ff34a683bf62	11cbfd2c00ca23749eb6aa614823b0545d14dddb19a175721c1b00529a93dcac	2026-07-10 16:19:48.084522+00	20260710151342_init_identity_schema	\N	\N	2026-07-10 16:19:48.046908+00	1
\.


--
-- TOC entry 3397 (class 0 OID 17516)
-- Dependencies: 220
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.refresh_tokens (id, user_id, token_hash, expires_at, revoked_at, created_at) FROM stdin;
9	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$HB/O68sM2nIBxxGS7Ycm.uHvL/jqqMyxvpnP1dt.K0dE0hEjWCyN6	2026-07-30 03:04:02.675+00	\N	2026-07-23 03:04:02.677+00
11	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$otH27WE5165otYl2QMEBfe05oalF8QDuJ4XafrD/gXFJfi/adK6Gy	2026-07-30 03:17:12.389+00	\N	2026-07-23 03:17:12.391+00
13	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$8/wVVtWddmapK7YOFfTK5.bJNXJ/tyFIKmmhM/iGktqxHS5f98VcK	2026-07-30 04:22:03.774+00	\N	2026-07-23 04:22:03.776+00
14	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$XvEIt/mUNmPmpFCLcs/B/uWTxM0tyo4Ba9ZrwEDdRNpGM6c/4guuG	2026-07-30 14:32:19.336+00	\N	2026-07-23 14:32:19.34+00
15	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$KxSR.uNVnuScBW1VS.9MnOkXV6wrKeS5GZMdLUXVFWnW/rwLTzIg.	2026-07-31 03:00:54.636+00	\N	2026-07-24 03:00:54.638+00
16	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$U/og7H4F99JNZ5n1HEg9tu5i2/ArLDEwcuRhMfR.FrHS9x0Bj7IQa	2026-08-03 14:40:49.502+00	\N	2026-07-27 14:40:49.504+00
17	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$iEr74pGdhyrHMK/a0jr3O.H0pJGo0eDiZQNDgZ3HXodHo2VNbDCNC	2026-08-04 08:42:53.16+00	\N	2026-07-28 08:42:53.165+00
18	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$sXlcJkxZbxckOjiffeIShOjlHVOt2e8/dB7pT6D0esBy5Pd0N0Ra.	2026-08-04 08:53:55.155+00	\N	2026-07-28 08:53:55.159+00
19	63570767-5f75-4526-8c2e-a324899b9919	$2b$10$vDC5OeekXr39iZYBB9P.MO6qDuYh8IzuVItDPpucvbnlB6nTgKzDi	2026-08-04 09:02:43.417+00	\N	2026-07-28 09:02:43.435+00
20	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$Y95Z8ZOguQPvKsiIirfa8.cR54NMWq2yqJAbqgT1EA1dflcKEvKIi	2026-08-04 14:21:58.387+00	\N	2026-07-28 14:21:58.39+00
21	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$6gaWv6mJhi/sQ2KWbpHJROzqAKqem9HWPLxhmSmMqO/mfdXDZXiYm	2026-08-05 02:48:05.279+00	\N	2026-07-29 02:48:05.283+00
22	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$NK6LWPLxgnAkOUCAxq5z4OypjD8bwJ0w3wXTPSRF8PN5UO2nZ.Gf.	2026-08-05 03:28:41.199+00	\N	2026-07-29 03:28:41.203+00
23	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$Qjp63xXx3mOgMLhhvP8abuaUDAM7a2NwYmfD1HRtRisvlIgs0vEMC	2026-08-05 03:47:46.949+00	\N	2026-07-29 03:47:46.95+00
24	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$w3/qs3f3LqExqbAvDfkbRONOnpf.Qs.vGOpMPmpeI3LphTqAjny9W	2026-08-08 15:02:43.265+00	\N	2026-08-01 15:02:43.27+00
25	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$BmOFI6OI2.erqa8e3LpKruGudFdBOJ8BW3m7YhMkOAZIpdi2SbfP2	2026-08-08 15:09:48.204+00	\N	2026-08-01 15:09:48.206+00
26	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$z1d7pfAbsozCDIRbqAFkUu8QsI024s1ISAdGoTxuejCahoOLVYtkK	2026-08-09 08:44:45.599+00	\N	2026-08-02 08:44:45.604+00
27	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$O/B1MuUBMqU6uhqQIFSJpePQGtlKIlJmCeVCuig2qSdT8g.y/OA1K	2026-08-09 14:10:02.347+00	\N	2026-08-02 14:10:02.354+00
29	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$Vr.NDfqQzOlqnlAvW83KJep16WMOMEV8T4/JNe.xmSWkd9S6QEyda	2026-08-09 15:15:47.471+00	\N	2026-08-02 15:15:47.475+00
30	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$IsJSeif9aX.1f7EwClgbeOj4KqaeI/yOAdSt8xnI4M9WHnIFosUDm	2026-08-09 15:27:48.032+00	\N	2026-08-02 15:27:48.034+00
31	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$b///BlsJEkqEJblFW7kBy.zGAJ7Q6F1NDRbctxR1uRydrTeqK7FUy	2026-08-09 15:30:26.937+00	\N	2026-08-02 15:30:26.939+00
32	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$CfsRpboA65B7gFHYGnRuvO35MN0URQG/07vIEDnkD1gg3j6jEk3.m	2026-08-15 14:35:10.12+00	\N	2026-08-08 14:35:10.123+00
33	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$CKCX43C9oJ/4jYpT0uOlM.XFBBNOZ0fTj.n/V3F6xdoxOnpFRt/Bu	2026-08-15 14:53:49.679+00	\N	2026-08-08 14:53:49.681+00
38	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$RGrWyuFAV6sjF5963nauH.vV2l.qgoJyMnXqG/dDz5jzr/YwY0cp.	2026-08-17 13:51:21.67+00	\N	2026-08-10 13:51:21.671+00
39	63570767-5f75-4526-8c2e-a324899b9919	$2b$10$nv2gpeiaipfZLzsF/7CZjurmrge8muaXbB9HXotiaeeK2PvkkhZSO	2026-08-18 15:11:49.529+00	\N	2026-08-11 15:11:49.552+00
40	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$NWt0oTji0via6K9vZmiwieAOViajxWjEyPCV2soRC4kylWPdgrElG	2026-08-20 15:29:05.523+00	\N	2026-08-13 15:29:05.527+00
41	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$mPoqq4nZB7ufOmJ3l8q1MOsNjCPCMRU292gFgKjov77C4rnFFGYG6	2026-08-20 15:36:42.821+00	\N	2026-08-13 15:36:42.823+00
42	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$wRSizh/y8.Kdm7ZoeQGMXOv7viq6uTcJMqxL51QJxITbpA33okifi	2026-08-20 15:38:31.499+00	\N	2026-08-13 15:38:31.5+00
43	2d5c3cdc-8a53-4ddc-a09e-571df4d3c1a3	$2b$10$8Ycv5kAgOecgrsn5Dw4BpuYj2l8DE4WoP.PdxWcAzs6MeUSw1tqwC	2026-08-27 14:10:03.49+00	\N	2026-08-20 14:10:03.492+00
44	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$yPy6dxr0cnS7lrTsN4YBjOFP3zS7x5h0Vn/SqdJWDgXeCR4tkzTIi	2026-08-27 14:15:58.25+00	\N	2026-08-20 14:15:58.253+00
45	8e975083-79d9-4226-b4b0-09c6630d5441	$2b$10$dATaL68fNV6i/pxT1xsHl.QZGYyHys1O78Qcoq5ZbeYJHTRcAyaXS	2026-08-27 15:11:26.057+00	\N	2026-08-20 15:11:26.058+00
46	2d5c3cdc-8a53-4ddc-a09e-571df4d3c1a3	$2b$10$vOGnjTq8URrL9ow7m3h9J.yDSLU/OJdenDwNYp8GG1oQRYyS0m9U.	2026-08-27 15:18:08.467+00	\N	2026-08-20 15:18:08.468+00
47	a538a9d1-e028-4cd8-a316-8010216a88f1	$2b$10$y16W1s5TDKh/6PHKiYy70.gtKbZ8NG6tWTJ1zCDZ1YD0mkkQKWD7.	2026-08-27 15:22:45.397+00	\N	2026-08-20 15:22:45.398+00
\.


--
-- TOC entry 3395 (class 0 OID 17505)
-- Dependencies: 218
-- Data for Name: user_addresses; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.user_addresses (id, user_id, receiver_name, phone, address_line, is_default, created_at) FROM stdin;
2	8e975083-79d9-4226-b4b0-09c6630d5441	Nguyễn Văn A	0123456789	01 Võ Văn ngân, tp HCM	f	2026-07-23 04:08:40.868+00
1	8e975083-79d9-4226-b4b0-09c6630d5441	Nguyễn Văn A	0123456789	97 Man Thiện, phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh	t	2026-07-23 04:07:47.355+00
3	63570767-5f75-4526-8c2e-a324899b9919	Đức đẹp chai	0123456789	97 Man Thiện	t	2026-07-28 09:03:44.784+00
4	2d5c3cdc-8a53-4ddc-a09e-571df4d3c1a3	Ho Minh Kho	09982554585	97 Man Thiện	t	2026-08-10 09:03:30.069+00
5	ba6e855f-3db9-4d54-899f-772edfd2c28c	Nguyen Van Du	0123456789	97 Man Thiện	t	2026-08-10 13:42:00.648+00
\.


--
-- TOC entry 3393 (class 0 OID 17491)
-- Dependencies: 216
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id, email, password_hash, full_name, phone, avatar_url, role, auth_provider, google_id, is_active, created_at, updated_at) FROM stdin;
a538a9d1-e028-4cd8-a316-8010216a88f1	admin@gmail.com	$2b$10$GH8FZdrcQmc6iwtiDBQpPOXh.DXdxpGdMbwfKXzLEdIVpTXK.DNM6	Quản trị viên	\N	\N	ADMIN	LOCAL	\N	t	2026-07-13 08:56:53.867+00	2026-07-13 09:00:33.762+00
410911bc-b9e4-4746-9ec6-ff79bc768cdc	nguyenvana@gmail.com	$2b$10$GH8FZdrcQmc6iwtiDBQpPOXh.DXdxpGdMbwfKXzLEdIVpTXK.DNM6	Nguyễn Văn A	\N	\N	CUSTOMER	LOCAL	\N	t	2026-07-13 08:56:53.875+00	2026-07-13 09:00:33.78+00
8e975083-79d9-4226-b4b0-09c6630d5441	a@gmail.com	$2b$10$hoCBlp4GjPJlSauapb4VGO2Cx9F8AvkCQwTCW3efpZddfBkmIXLUO	Nguyen Van A		\N	CUSTOMER	LOCAL	\N	t	2026-07-13 08:54:21.259+00	2026-07-27 14:54:02.846+00
63570767-5f75-4526-8c2e-a324899b9919	ducdepzai32@gmail.com	\N	Đức Nguyễn	0123456789	https://lh3.googleusercontent.com/a/ACg8ocIEi8a1v9De3SrmZRyeKa8eGfLKuj4nneRs0T1Zo7l-kGoFBZju=s96-c	CUSTOMER	GOOGLE	101635458944825696472	t	2026-07-28 09:02:43.319+00	2026-07-28 09:03:21.239+00
58a6411d-12b0-49e7-b6a0-f1ade8a72ea1	b@gmail.com	$2b$10$F6JQNlovhL1EBMFij0khcuWKsDudL7y4BEQU3liw6E8YEMuLAFbeG	Nguyen Van B	\N	\N	CUSTOMER	LOCAL	\N	t	2026-08-02 14:10:47.94+00	2026-08-02 14:10:47.94+00
2d5c3cdc-8a53-4ddc-a09e-571df4d3c1a3	ductc2308@gmail.com	\N	Đức Nguyễn	\N	https://lh3.googleusercontent.com/a/ACg8ocLh0MkO8-bPfFhMhQG0ZDqCQOwDfjW3DbPpXqFFQfruO80Ydw=s96-c	CUSTOMER	GOOGLE	104867316206680745816	t	2026-08-10 08:42:23.438+00	2026-08-10 08:42:23.438+00
ba6e855f-3db9-4d54-899f-772edfd2c28c	nguyenvandulv@gmail.com	$2b$10$qdDKA.kCfgCjTcjmqlRZ7u/RZqK3SSHFdHmJBNX597ARm9VUxr8WS	Nguyen Van Du	\N	\N	CUSTOMER	LOCAL	\N	t	2026-08-10 13:38:47.872+00	2026-08-10 13:38:47.872+00
\.


--
-- TOC entry 3405 (class 0 OID 0)
-- Dependencies: 219
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 47, true);


--
-- TOC entry 3406 (class 0 OID 0)
-- Dependencies: 217
-- Name: user_addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.user_addresses_id_seq', 5, true);


--
-- TOC entry 3236 (class 2606 OID 17479)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3246 (class 2606 OID 17522)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3243 (class 2606 OID 17514)
-- Name: user_addresses user_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 3240 (class 2606 OID 17503)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3244 (class 1259 OID 17526)
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- TOC entry 3241 (class 1259 OID 17525)
-- Name: idx_user_addresses_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_addresses_user_id ON public.user_addresses USING btree (user_id);


--
-- TOC entry 3237 (class 1259 OID 17523)
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- TOC entry 3238 (class 1259 OID 17524)
-- Name: users_google_id_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX users_google_id_key ON public.users USING btree (google_id);


--
-- TOC entry 3248 (class 2606 OID 17532)
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3247 (class 2606 OID 17527)
-- Name: user_addresses user_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2026-08-21 10:44:56

--
-- PostgreSQL database dump complete
--

\unrestrict sCBbfjd0wW8wtJuAiNHwj0ejsmL8qnRDUzw1Oijuj5Bf3vow7OWSRsYncXaXR7t

