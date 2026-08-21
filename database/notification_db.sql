--
-- PostgreSQL database dump
--

\restrict 8sDJu0PBfXd9IXJpy5QU4TrpQpSpOEnEaydCkhxAyrHJQv5UKJZ1cyB1Kguwyma

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg12+1)
-- Dumped by pg_dump version 18.0

-- Started on 2026-08-21 10:54:46

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
-- TOC entry 847 (class 1247 OID 17702)
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED'
);


ALTER TYPE public."NotificationStatus" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 17692)
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
-- TOC entry 217 (class 1259 OID 17710)
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.notification_templates (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    subject_template text NOT NULL,
    body_template text NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notification_templates OWNER TO admin;

--
-- TOC entry 216 (class 1259 OID 17709)
-- Name: notification_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.notification_templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_templates_id_seq OWNER TO admin;

--
-- TOC entry 3385 (class 0 OID 0)
-- Dependencies: 216
-- Name: notification_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.notification_templates_id_seq OWNED BY public.notification_templates.id;


--
-- TOC entry 219 (class 1259 OID 17720)
-- Name: notifications; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    recipient_email character varying(255) NOT NULL,
    template_code character varying(50) NOT NULL,
    related_order_id uuid,
    payload jsonb,
    status public."NotificationStatus" DEFAULT 'PENDING'::public."NotificationStatus" NOT NULL,
    retry_count smallint DEFAULT 0 NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO admin;

--
-- TOC entry 218 (class 1259 OID 17719)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO admin;

--
-- TOC entry 3386 (class 0 OID 0)
-- Dependencies: 218
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 3217 (class 2604 OID 17713)
-- Name: notification_templates id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notification_templates ALTER COLUMN id SET DEFAULT nextval('public.notification_templates_id_seq'::regclass);


--
-- TOC entry 3219 (class 2604 OID 17723)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 3375 (class 0 OID 17692)
-- Dependencies: 215
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1038feb4-735b-4717-8b5a-db201e24dd74	3a775adce12c6efbb4428b08e0a2720f8c783e75221d6f4eafa3921308b89112	2026-07-10 16:20:11.111719+00	20260710155326_init_notification_schema	\N	\N	2026-07-10 16:20:11.082769+00	1
\.


--
-- TOC entry 3377 (class 0 OID 17710)
-- Dependencies: 217
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.notification_templates (id, code, subject_template, body_template, updated_at) FROM stdin;
1	ORDER_CONFIRM	Xác nhận đơn hàng #{{orderId}}	```html\n<div style="margin:0;padding:40px 20px;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">\n  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">\n\n    <!-- Header -->\n    <div style="background:#2563eb;padding:24px;text-align:center;">\n      <h2 style="margin:0;color:#ffffff;font-size:24px;">\n        Đơn hàng đã được xác nhận\n      </h2>\n    </div>\n\n    <!-- Content -->\n    <div style="padding:32px;color:#374151;line-height:1.7;">\n\n      <p style="margin-top:0;">\n        Xin chào <strong>{{customerName}}</strong>,\n      </p>\n\n      <p>\n        Cảm ơn bạn đã mua sắm tại cửa hàng. Chúng tôi đã nhận được đơn hàng của bạn và sẽ tiến hành xử lý trong thời gian sớm nhất.\n      </p>\n\n      <div style="margin:28px 0;padding:20px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">\n        <table width="100%" cellpadding="6" cellspacing="0">\n          <tr>\n            <td style="color:#6b7280;">Mã đơn hàng</td>\n            <td align="right"><strong>#{{orderId}}</strong></td>\n          </tr>\n          <tr>\n            <td style="color:#6b7280;">Tổng thanh toán</td>\n            <td align="right">\n              <strong style="color:#2563eb;font-size:18px;">\n                {{totalAmount}} VNĐ\n              </strong>\n            </td>\n          </tr>\n        </table>\n      </div>\n\n      <p style="margin-bottom:0;">\n        Cảm ơn bạn đã tin tưởng và lựa chọn chúng tôi.\n      </p>\n\n    </div>\n\n    <!-- Footer -->\n    <div style="padding:18px;text-align:center;border-top:1px solid #e5e7eb;background:#fafafa;">\n      <p style="margin:0;font-size:12px;color:#9ca3af;">\n        Đây là email tự động, vui lòng không trả lời email này.\n      </p>\n    </div>\n\n  </div>\n</div>\n```\n	2026-07-28 09:09:35.966+00
2	ORDER_SHIPPING	Đơn hàng #{{orderId}} đang được giao	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">\n        <h2 style="color: #f39c12; text-align: center;">Đơn hàng đang trên đường đến!</h2>\n        <p>Xin chào <strong>{{customerName}}</strong>,</p>\n        <p>Tin vui! Đơn hàng <strong>#{{orderId}}</strong> của bạn đã được bàn giao cho đơn vị vận chuyển.</p>\n        <p>Tổng thanh toán: <strong style="color: #e74c3c;">{{totalAmount}} VNĐ</strong></p>\n        <p>Vui lòng chú ý điện thoại để nhận hàng từ shipper.</p>\n        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">\n        <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>\n      </div>\n      	2026-07-29 04:09:17.66+00
3	ORDER_DELIVERED	Giao hàng thành công #{{orderId}}	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">\n        <h2 style="color: #27ae60; text-align: center;">Giao hàng thành công!</h2>\n        <p>Xin chào <strong>{{customerName}}</strong>,</p>\n        <p>Đơn hàng <strong>#{{orderId}}</strong> của bạn đã được giao thành công.</p>\n        <p>Tổng thanh toán: <strong style="color: #e74c3c;">{{totalAmount}} VNĐ</strong></p>\n        <p>Hy vọng bạn hài lòng với sản phẩm. Đừng quên để lại đánh giá nhé!</p>\n        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">\n        <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>\n      </div>\n      	2026-07-29 04:09:17.671+00
4	ORDER_CANCELLED	Đơn hàng #{{orderId}} đã bị hủy	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">\n        <h2 style="color: #c0392b; text-align: center;">Đơn hàng đã bị hủy</h2>\n        <p>Xin chào <strong>{{customerName}}</strong>,</p>\n        <p>Rất tiếc phải thông báo đơn hàng <strong>#{{orderId}}</strong> của bạn đã bị hủy.</p>\n        <p>Tổng thanh toán: <strong style="color: #e74c3c;">{{totalAmount}} VNĐ</strong></p>\n        <p>Nếu bạn đã thanh toán, tiền sẽ được hoàn lại theo quy định của cửa hàng.</p>\n        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">\n        <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>\n      </div>\n      	2026-07-29 04:09:17.678+00
\.


--
-- TOC entry 3379 (class 0 OID 17720)
-- Dependencies: 219
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.notifications (id, recipient_email, template_code, related_order_id, payload, status, retry_count, sent_at, created_at) FROM stdin;
2	ducdepzai32@gmail.com	ORDER_CONFIRM	e4f32d46-c2a1-4908-8621-3017b9521445	{"email": "ducdepzai32@gmail.com", "orderId": "e4f32d46-c2a1-4908-8621-3017b9521445", "totalAmount": "72990", "customerName": "Đức Nguyễn"}	FAILED	0	\N	2026-07-28 09:13:06.871+00
3	ducdepzai32@gmail.com	ORDER_CONFIRM	ef9aef42-ca8e-4d18-93f9-ace467f93996	{"email": "ducdepzai32@gmail.com", "orderId": "ef9aef42-ca8e-4d18-93f9-ace467f93996", "totalAmount": "72990", "customerName": "Đức Nguyễn"}	FAILED	0	\N	2026-07-28 09:15:51.584+00
4	ducdepzai32@gmail.com	ORDER_CONFIRM	179197d6-f960-4c47-ad87-8b14a11b32d6	{"email": "ducdepzai32@gmail.com", "orderId": "179197d6-f960-4c47-ad87-8b14a11b32d6", "totalAmount": "72990", "customerName": "Đức Nguyễn"}	FAILED	0	\N	2026-07-28 09:17:54.199+00
5	ducdepzai32@gmail.com	ORDER_CONFIRM	1b919c54-5738-4e4f-b17c-9256cb3aacd3	{"email": "ducdepzai32@gmail.com", "orderId": "1b919c54-5738-4e4f-b17c-9256cb3aacd3", "totalAmount": "38990000", "customerName": "Đức Nguyễn"}	SENT	0	2026-07-28 09:19:27.96+00	2026-07-28 09:19:13.419+00
6	ducdepzai32@gmail.com	ORDER_CONFIRM	1b1854b1-395b-4180-bb9a-cece04738a72	{"email": "ducdepzai32@gmail.com", "orderId": "1b1854b1-395b-4180-bb9a-cece04738a72", "totalAmount": "38990000", "customerName": "Đức Nguyễn"}	SENT	0	2026-07-28 09:38:48.94+00	2026-07-28 09:38:33.68+00
7	a@gmail.com	ORDER_CONFIRM	cf10246e-5d57-4c19-956e-4350b243f2e2	{"email": "a@gmail.com", "orderId": "cf10246e-5d57-4c19-956e-4350b243f2e2", "totalAmount": "119980000", "customerName": "Nguyen Van A"}	SENT	0	2026-07-28 14:29:44.704+00	2026-07-28 14:29:28.89+00
8	a@gmail.com	ORDER_CONFIRM	75406008-e1fe-4cc0-a390-49887c168103	{"email": "a@gmail.com", "orderId": "75406008-e1fe-4cc0-a390-49887c168103", "totalAmount": "38990000", "customerName": "Nguyen Van A"}	SENT	0	2026-07-28 15:13:47.63+00	2026-07-28 15:13:32.375+00
9	a@gmail.com	ORDER_CONFIRM	650cff35-4588-4c8f-8440-d17d6366ffea	{"email": "a@gmail.com", "orderId": "650cff35-4588-4c8f-8440-d17d6366ffea", "totalAmount": "28990000", "customerName": "Nguyen Van A"}	SENT	0	2026-07-28 15:52:30.855+00	2026-07-28 15:52:14.843+00
10	a@gmail.com	ORDER_CONFIRM	39818cdc-7922-4fd1-8156-0dd574113c22	{"email": "a@gmail.com", "orderId": "39818cdc-7922-4fd1-8156-0dd574113c22", "totalAmount": "28590000", "customerName": "Nguyen Van A"}	SENT	0	2026-07-28 16:07:46.008+00	2026-07-28 16:07:31.385+00
11	a@gmail.com	ORDER_CONFIRM	11e3da79-9c8c-4feb-8e7e-4b0d6cbc2656	{"email": "a@gmail.com", "orderId": "11e3da79-9c8c-4feb-8e7e-4b0d6cbc2656", "totalAmount": "38990000", "customerName": "Nguyen Van A"}	SENT	0	2026-07-29 03:36:09.789+00	2026-07-29 03:35:53.771+00
12	a@gmail.com	ORDER_CONFIRM	f565910c-f416-4c32-875f-71d1da0afc26	{"email": "a@gmail.com", "orderId": "f565910c-f416-4c32-875f-71d1da0afc26", "totalAmount": "27990000", "customerName": "Nguyen Van A"}	SENT	0	2026-07-29 03:41:46.006+00	2026-07-29 03:41:31.358+00
13	ducdepzai32@gmail.com	ORDER_SHIPPING	179197d6-f960-4c47-ad87-8b14a11b32d6	{"email": "ducdepzai32@gmail.com", "orderId": "179197d6-f960-4c47-ad87-8b14a11b32d6", "totalAmount": "72990", "customerName": "Đức Nguyễn"}	SENT	0	2026-07-29 04:28:10.328+00	2026-07-29 04:27:55.801+00
14	a@gmail.com	ORDER_CONFIRM	889b2aa4-a44d-4116-b99a-5c39a6af168a	{"email": "a@gmail.com", "orderId": "889b2aa4-a44d-4116-b99a-5c39a6af168a", "totalAmount": "7290000", "customerName": "Nguyen Van A"}	SENT	0	2026-08-02 08:54:44.684+00	2026-08-02 08:54:29.291+00
15	a@gmail.com	ORDER_CONFIRM	9cc206d1-f340-4506-ab61-71009071aef9	{"email": "a@gmail.com", "orderId": "9cc206d1-f340-4506-ab61-71009071aef9", "totalAmount": "10490000", "customerName": "Nguyen Van A"}	SENT	0	2026-08-02 09:06:33.476+00	2026-08-02 09:06:18.844+00
16	a@gmail.com	ORDER_CONFIRM	74249590-f23e-4223-a303-8810c1317e37	{"email": "a@gmail.com", "orderId": "74249590-f23e-4223-a303-8810c1317e37", "totalAmount": "39992000", "customerName": "Nguyen Van A"}	SENT	0	2026-08-02 16:01:53.258+00	2026-08-02 16:01:37.309+00
17	a@gmail.com	ORDER_CANCELLED	96627dd6-f262-4b7e-900e-5bdfe96ed437	{"email": "a@gmail.com", "orderId": "96627dd6-f262-4b7e-900e-5bdfe96ed437", "totalAmount": "62082000", "customerName": "Nguyen Van A"}	SENT	0	2026-08-08 14:45:07.828+00	2026-08-08 14:44:51.766+00
18	a@gmail.com	ORDER_CANCELLED	167443d8-b289-417c-b0b6-543cfbf387fa	{"email": "a@gmail.com", "orderId": "167443d8-b289-417c-b0b6-543cfbf387fa", "totalAmount": "31192000", "customerName": "Nguyen Van A"}	SENT	0	2026-08-08 14:49:10.269+00	2026-08-08 14:49:06.044+00
19	a@gmail.com	ORDER_CONFIRM	2b410417-77a8-4ed0-85de-369748eba107	{"email": "a@gmail.com", "orderId": "2b410417-77a8-4ed0-85de-369748eba107", "totalAmount": "35991000", "customerName": "Nguyen Van A"}	SENT	0	2026-08-08 14:49:21.7+00	2026-08-08 14:49:17.607+00
20	ductc2308@gmail.com	ORDER_CANCELLED	ddb6d9ab-672c-456b-8637-64650610851e	{"email": "ductc2308@gmail.com", "orderId": "ddb6d9ab-672c-456b-8637-64650610851e", "totalAmount": "799999750", "customerName": "Đức Nguyễn"}	SENT	0	2026-08-10 09:02:42.567+00	2026-08-10 09:02:26.313+00
21	ductc2308@gmail.com	ORDER_CONFIRM	117f3dc7-8711-473b-9ad2-023b087d52ed	{"email": "ductc2308@gmail.com", "orderId": "117f3dc7-8711-473b-9ad2-023b087d52ed", "totalAmount": "254750", "customerName": "Đức Nguyễn"}	SENT	0	2026-08-10 09:04:03.507+00	2026-08-10 09:03:57.931+00
22	nguyenvandulv@gmail.com	ORDER_CANCELLED	41784fb3-f28e-479c-bdd0-380b70497228	{"email": "nguyenvandulv@gmail.com", "orderId": "41784fb3-f28e-479c-bdd0-380b70497228", "totalAmount": "279750", "customerName": "Nguyen Van Du"}	SENT	0	2026-08-10 13:43:14.013+00	2026-08-10 13:42:59.171+00
23	ductc2308@gmail.com	ORDER_CANCELLED	a13e74cd-86a3-499d-98ec-019eb16b7608	{"email": "ductc2308@gmail.com", "orderId": "a13e74cd-86a3-499d-98ec-019eb16b7608", "totalAmount": "19999750", "customerName": "Đức Nguyễn"}	SENT	0	2026-08-10 13:47:35.3+00	2026-08-10 13:47:30.534+00
24	ductc2308@gmail.com	ORDER_CONFIRM	27956d59-892c-4a3d-85f6-4eb3397ecbec	{"email": "ductc2308@gmail.com", "orderId": "27956d59-892c-4a3d-85f6-4eb3397ecbec", "totalAmount": "7499750", "customerName": "Đức Nguyễn"}	SENT	0	2026-08-10 13:48:42.15+00	2026-08-10 13:48:26.682+00
25	ductc2308@gmail.com	ORDER_SHIPPING	27956d59-892c-4a3d-85f6-4eb3397ecbec	{"email": "ductc2308@gmail.com", "orderId": "27956d59-892c-4a3d-85f6-4eb3397ecbec", "totalAmount": "7499750", "customerName": "Đức Nguyễn"}	SENT	0	2026-08-10 13:55:11.861+00	2026-08-10 13:54:57.11+00
26	a@gmail.com	ORDER_CONFIRM	db72ea5c-2577-48f9-af7f-836fb397ad8e	{"email": "a@gmail.com", "orderId": "db72ea5c-2577-48f9-af7f-836fb397ad8e", "totalAmount": "3249750", "customerName": "Nguyen Van A"}	SENT	0	2026-08-13 15:37:27.28+00	2026-08-13 15:37:12.511+00
27	a@gmail.com	ORDER_CONFIRM	94d74706-3206-41d7-b128-a7f11f165116	{"email": "a@gmail.com", "orderId": "94d74706-3206-41d7-b128-a7f11f165116", "totalAmount": "254750", "customerName": "Nguyen Van A"}	SENT	0	2026-08-13 15:37:37.282+00	2026-08-13 15:37:32.972+00
28	a@gmail.com	ORDER_CONFIRM	e6e2acd2-554f-4d68-9b3f-488d53c9b2a4	{"email": "a@gmail.com", "orderId": "e6e2acd2-554f-4d68-9b3f-488d53c9b2a4", "totalAmount": "6374788", "customerName": "Nguyen Van A"}	SENT	0	2026-08-13 15:37:58.297+00	2026-08-13 15:37:53.083+00
29	a@gmail.com	ORDER_CONFIRM	138f9303-1f24-49c8-9174-46967e04d25b	{"email": "a@gmail.com", "orderId": "138f9303-1f24-49c8-9174-46967e04d25b", "totalAmount": "999500", "customerName": "Nguyen Van A"}	SENT	0	2026-08-13 15:38:07.768+00	2026-08-13 15:38:02.527+00
30	a@gmail.com	ORDER_CONFIRM	85f7acc4-e3ba-4e54-9a73-61dd107fd59c	{"email": "a@gmail.com", "orderId": "85f7acc4-e3ba-4e54-9a73-61dd107fd59c", "totalAmount": "2123750", "customerName": "Nguyen Van A"}	SENT	0	2026-08-13 15:38:17.008+00	2026-08-13 15:38:12.825+00
31	ductc2308@gmail.com	ORDER_CONFIRM	f9a1291f-e8c6-4151-b34e-3858b44a9038	{"email": "ductc2308@gmail.com", "orderId": "f9a1291f-e8c6-4151-b34e-3858b44a9038", "totalAmount": "204750", "customerName": "Đức Nguyễn"}	SENT	0	2026-08-20 14:10:44.789+00	2026-08-20 14:10:29.709+00
32	ductc2308@gmail.com	ORDER_CONFIRM	583741e2-a945-4e34-a510-d505eb5af896	{"email": "ductc2308@gmail.com", "orderId": "583741e2-a945-4e34-a510-d505eb5af896", "totalAmount": "404750", "customerName": "Đức Nguyễn"}	SENT	0	2026-08-20 14:12:24.004+00	2026-08-20 14:12:19.082+00
33	ductc2308@gmail.com	ORDER_CANCELLED	52ff283f-2c0b-4bd0-bcb6-7c255adbc49e	{"email": "ductc2308@gmail.com", "orderId": "52ff283f-2c0b-4bd0-bcb6-7c255adbc49e", "totalAmount": "204750", "customerName": "Đức Nguyễn"}	SENT	0	2026-08-20 14:13:51.145+00	2026-08-20 14:13:45.731+00
34	ductc2308@gmail.com	ORDER_CANCELLED	d5fddb76-20ca-4d86-bf81-d770118e147a	{"email": "ductc2308@gmail.com", "orderId": "d5fddb76-20ca-4d86-bf81-d770118e147a", "totalAmount": "129750", "customerName": "Đức Nguyễn"}	SENT	0	2026-08-20 14:15:05.961+00	2026-08-20 14:15:01.306+00
35	ductc2308@gmail.com	ORDER_SHIPPING	583741e2-a945-4e34-a510-d505eb5af896	{"email": "ductc2308@gmail.com", "orderId": "583741e2-a945-4e34-a510-d505eb5af896", "totalAmount": "404750", "customerName": "Đức Nguyễn"}	SENT	0	2026-08-20 14:17:14.164+00	2026-08-20 14:16:58.482+00
37	ductc2308@gmail.com	ORDER_SHIPPING	583741e2-a945-4e34-a510-d505eb5af896	{"email": "ductc2308@gmail.com", "orderId": "583741e2-a945-4e34-a510-d505eb5af896", "totalAmount": "404750", "customerName": "Đức Nguyễn"}	SENT	0	2026-08-20 14:17:15.947+00	2026-08-20 14:17:11.469+00
36	ductc2308@gmail.com	ORDER_CONFIRM	583741e2-a945-4e34-a510-d505eb5af896	{"email": "ductc2308@gmail.com", "orderId": "583741e2-a945-4e34-a510-d505eb5af896", "totalAmount": "404750", "customerName": "Đức Nguyễn"}	SENT	0	2026-08-20 14:17:23.022+00	2026-08-20 14:17:07.59+00
\.


--
-- TOC entry 3387 (class 0 OID 0)
-- Dependencies: 216
-- Name: notification_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.notification_templates_id_seq', 4, true);


--
-- TOC entry 3388 (class 0 OID 0)
-- Dependencies: 218
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.notifications_id_seq', 37, true);


--
-- TOC entry 3224 (class 2606 OID 17700)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3227 (class 2606 OID 17718)
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3230 (class 2606 OID 17730)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3228 (class 1259 OID 17732)
-- Name: idx_notifications_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_notifications_status ON public.notifications USING btree (status);


--
-- TOC entry 3225 (class 1259 OID 17731)
-- Name: notification_templates_code_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX notification_templates_code_key ON public.notification_templates USING btree (code);


--
-- TOC entry 3231 (class 2606 OID 17733)
-- Name: notifications notifications_template_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_template_code_fkey FOREIGN KEY (template_code) REFERENCES public.notification_templates(code) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2026-08-21 10:54:46

--
-- PostgreSQL database dump complete
--

\unrestrict 8sDJu0PBfXd9IXJpy5QU4TrpQpSpOEnEaydCkhxAyrHJQv5UKJZ1cyB1Kguwyma

