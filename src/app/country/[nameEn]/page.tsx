"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { countryDB } from "@/data/country";
import { ArrowLeft, ExternalLink, Globe, Shield, Database, Loader2, FileText, Building2, Mail, Phone, MapPin, Download } from "lucide-react";

interface ContactInfo {
  name: string;
  email: string[];
  phone: string[];
  address: string;
}

interface LawMeasure {
  title: string;
  link: string;
}

interface AbschDetailData {
  cnaContacts: ContactInfo[];
  laws: LawMeasure[];
  irccCount: number;
}

export default function CountryDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const countryNameEn = (params.nameEn || params.slug) as string;
  
  const country = countryDB.find((c) => {
    const databaseSlug = c.nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return databaseSlug === countryNameEn;
  });

  const [apiData, setApiData] = useState<AbschDetailData>({ cnaContacts: [], laws: [], irccCount: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!country || !country.isoCode) return;

    const fetchAbschDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const countryCode = country.isoCode.toLowerCase().trim();
        const apiUrl = `https://api.cbd.int/api/v2013/index/select?q=government_s:${countryCode}+AND+(schema_s:authority+OR+schema_s:measure+OR+schema_s:absPermit)&fl=*&rows=1000&wt=json`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("ABSCH 실시간 데이터를 가져오는데 실패했습니다.");
        
        const result = await response.json();
        const docs = result.response?.docs || [];

        const uniqueDocs = new Map();
        
        docs.forEach((doc: any) => {
          if (doc.identifier_s) {
            const existingDoc = uniqueDocs.get(doc.identifier_s);
            const existingRev = existingDoc ? (existingDoc._revision_i || 0) : -1;
            const currentRev = doc._revision_i || 0;
            if (currentRev >= existingRev) {
              uniqueDocs.set(doc.identifier_s, doc);
            }
          }
        });

        const validDocs = Array.from(uniqueDocs.values()).filter((doc: any) => {
          if (doc._state_s && doc._state_s !== 'public') return false; 
          
          const realms = doc.realm_ss || [];
          const isBCH = realms.some((r: string) => r.toUpperCase().includes('BCH') || r.toUpperCase().includes('BIOSAFETY'));
          const isABS = realms.some((r: string) => r.toUpperCase().includes('ABS'));
          
          if (isBCH && !isABS) return false; 

          return true;
        });

        const tempContacts: ContactInfo[] = [];
        const tempLaws: LawMeasure[] = [];
        let tempIrccCount = 0;

        validDocs.forEach((doc: any) => {
          
          if (doc.schema_s === "authority") {
            const cnaName = doc.title_EN_t || doc.title_t || "National Competent Authority (CNA)";
            const nameLower = cnaName.toLowerCase();

            const isNFP = nameLower.includes("focal point") || nameLower.includes("nfp");
            const isPA = nameLower.includes("publishing authority");
            const isCNA = nameLower.includes("competent") || nameLower.includes("cna") || doc.absFunctions_ss || doc.absFunctions_EN_t;

            if ((isNFP || isPA) && !isCNA) return;
            if (nameLower.includes("biosafety") || nameLower.includes("cartagena")) return;

            // 이메일 추출
            let emails: string[] = [];
            const emailFields = ['email_ss', 'emails_ss', 'email_s', 'emails_s', 'contactEmail_ss', 'contactEmails_ss'];
            for (const field of emailFields) {
              if (doc[field]) emails = emails.concat(Array.isArray(doc[field]) ? doc[field] : [doc[field]]);
            }
            if (emails.length === 0) {
              const rawString = JSON.stringify(doc);
              const matches = rawString.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
              if (matches) emails = Array.from(new Set(matches));
            }
            emails = Array.from(new Set(emails)); 

            // 전화번호 추출 및 딥스캔 정규식 강화
            let phones: string[] = [];
            const phoneFields = ['telephone_ss', 'telephones_ss', 'phone_ss', 'phones_ss', 'telephone_s', 'phone_s', 'contactTelephone_ss', 'fax_ss', 'faxes_ss'];
            for (const field of phoneFields) {
              if (doc[field]) phones = phones.concat(Array.isArray(doc[field]) ? doc[field] : [doc[field]]);
            }
            // 📍 지정된 필드에 번호가 없을 경우, JSON 원본에서 국제 전화번호(+) 패턴 강제 추출
            if (phones.length === 0) {
              const rawString = JSON.stringify(doc);
              // + 또는 00으로 시작하는 8자리 이상의 숫자/하이픈/괄호 패턴 찾기
              const phoneMatches = rawString.match(/(?:\+|00)[0-9][0-9 \-\(\)\.]{7,20}(?=[^0-9\-\(\)\.]|$)/g);
              if (phoneMatches) phones = Array.from(new Set(phoneMatches.map(p => p.trim())));
            }
            // 쓸데없이 짧거나 이상한 문자열은 필터링
            phones = Array.from(new Set(phones)).filter(p => p.length > 5); 
            
            const address = doc.address_EN_t || doc.address_t || doc.address_s || doc.city_EN_t || "";

            const existingIndex = tempContacts.findIndex(c => c.name === cnaName);
            if (existingIndex > -1) {
              tempContacts[existingIndex].email = Array.from(new Set([...tempContacts[existingIndex].email, ...emails]));
              tempContacts[existingIndex].phone = Array.from(new Set([...tempContacts[existingIndex].phone, ...phones]));
              if (!tempContacts[existingIndex].address && address) tempContacts[existingIndex].address = address;
            } else {
              tempContacts.push({
                name: cnaName,
                email: emails,
                phone: phones,
                address: address,
              });
            }
          }
          else if (doc.schema_s === "measure") {
            const fileLink = doc.attachments_ss?.[0] || doc.url_ss?.[0] || `https://absch.cbd.int/en/database/${doc.identifier_s}`;
            let lawTitle = "Registered ABS Measure";
            if (doc.title_EN_t) lawTitle = doc.title_EN_t;
            else if (doc.title_t) lawTitle = doc.title_t;

            if (!tempLaws.some(l => l.title === lawTitle || l.link === fileLink)) {
              tempLaws.push({ title: lawTitle, link: fileLink });
            }
          }
          else if (doc.schema_s === "absPermit") {
            tempIrccCount++;
          }
        });

        setApiData({
          cnaContacts: tempContacts,
          laws: tempLaws,
          irccCount: tempIrccCount,
        });

      } catch (err: any) {
        console.error("ABSCH API 파싱 에러:", err);
        setError("실시간 정보 동기화 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAbschDetails();
  }, [country]);

  if (!country) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <p className="text-xl font-bold text-gray-600 mb-4">해당 국가의 데이터를 찾을 수 없습니다.</p>
        <button onClick={() => router.push("/")} className="bg-[#004098] text-white px-6 py-2 rounded-lg font-bold">홈으로 가기</button>
      </div>
    );
  }

  const currentCountryCode = country.isoCode.toUpperCase();
  const irccSearchUrl = `https://absch.cbd.int/en/countries/${currentCountryCode}/IRCC`;

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <header className="bg-white border-b-4 border-[#004098] p-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push("/")} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-[#004098] font-bold text-2xl">{country.nameKo} 국가별 ABS 정보</h1>
            <p className="text-sm text-gray-500 font-mono">{country.nameEn}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-10 px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white rounded-xl shadow-md">
            <Loader2 className="animate-spin text-[#004098] mb-3" size={40} />
            <p className="text-sm">국제 ABSCH 데이터 허브에서 정밀 통합 데이터를 필터링하고 있습니다...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center border border-red-100 shadow-md">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            
            <div className="bg-white p-8 rounded-xl shadow-md border-t-4 border-[#004098]">
              <div className="flex items-center gap-2 mb-4 text-[#004098] border-b pb-2">
                <Globe size={22} />
                <h2 className="text-xl font-bold">나고야의정서 지위 및 국가책임기관(CNA)</h2>
              </div>
              <p className="text-lg text-gray-700 mb-6">
                현재 <strong className="text-[#004098]">{country.nameKo}</strong>은(는) 나고야의정서 <span className="font-bold underline">{country.nagoya ? "당사국 (Party)" : "비당사국 (Non-Party)"}</span> 상태입니다.
              </p>
              <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-1">
                <Building2 size={16} /> 공식 지정 책임기관 연락처 정보
              </h3>
              {apiData.cnaContacts.length === 0 ? (
                <p className="text-sm text-gray-400 bg-gray-50 p-4 rounded-lg">등록된 공식 책임기관 정보가 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {apiData.cnaContacts.map((contact, idx) => (
                    <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-gray-800 mb-3 text-base text-[#004098] leading-snug">{contact.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        
                        {/* 📍 이메일 줄바꿈 처리 */}
                        <div className="flex items-start gap-2">
                          <Mail size={16} className="text-[#004098] shrink-0 mt-0.5" />
                          <div className="flex flex-col gap-1 break-all">
                            {contact.email.length > 0 ? (
                              contact.email.map((em, i) => <span key={i}>{em}</span>)
                            ) : (
                              <span className="text-gray-400">공식 포털 내 상세 프로필 참조</span>
                            )}
                          </div>
                        </div>

                        {/* 📍 전화번호 줄바꿈 처리 */}
                        <div className="flex items-start gap-2">
                          <Phone size={16} className="text-[#004098] shrink-0 mt-0.5" />
                          <div className="flex flex-col gap-1">
                            {contact.phone.length > 0 ? (
                              contact.phone.map((ph, i) => <span key={i}>{ph}</span>)
                            ) : (
                              <span className="text-gray-400">공식 포털 내 상세 프로필 참조</span>
                            )}
                          </div>
                        </div>

                        {/* 주소 */}
                        {contact.address && (
                          <div className="flex items-start gap-2 md:col-span-2 mt-1">
                            <MapPin size={16} className="text-[#004098] shrink-0 mt-0.5" />
                            <span className="leading-relaxed">소속/주소: {contact.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md border-t-4 border-[#52A55D]">
              <div className="flex items-center gap-2 mb-4 text-[#52A55D] border-b pb-2">
                <Shield size={22} />
                <h2 className="text-xl font-bold">국내 법령/조치 및 규제 정보</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                해당 정부가 ABS 관리를 위해 공식 등록한 조치 법률 리스트입니다. 버튼을 클릭하면 원문 문서 보관소 또는 다운로드 페이지로 즉시 연결됩니다.
              </p>
              {apiData.laws.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-400 text-sm">
                  현재 ABSCH에 등록된 국내 승인 법령 조치가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {apiData.laws.map((law, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-green-50/50 rounded-lg border border-green-100 hover:bg-green-50 transition-all">
                      <div className="flex items-start gap-2.5 max-w-[85%]">
                        <FileText size={18} className="text-[#52A55D] shrink-0 mt-1" />
                        <span className="font-medium text-gray-800 text-sm leading-snug">{law.title}</span>
                      </div>
                      <a href={law.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-[#52A55D] text-white text-xs py-2 px-4 rounded-md font-bold hover:bg-opacity-90 transition-all shadow-sm shrink-0">
                        <Download size={14} /> 원문/링크 보기
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md border-t-4 border-purple-500">
              <div className="flex items-center gap-2 mb-4 text-purple-600 border-b pb-2">
                <Database size={22} />
                <h2 className="text-xl font-bold">국제인증준수 인증서 (IRCC) 현황</h2>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-gray-800 font-medium mb-1">
                    현재 ABSCH에 공식 기록된 {country.nameKo}의 고유 IRCC 발행 건수는 <strong className="text-purple-700 text-lg">{apiData.irccCount}건</strong>입니다.
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    아래 버튼을 누르면 해당 국가 정부가 공식 승인한 실제 허가증(IRCC) 결과 목록으로 안전하게 이동합니다.
                  </p>
                </div>
                <a href={irccSearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-purple-600 text-white text-sm py-3 px-5 rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-sm shrink-0">
                  <ExternalLink size={16} /> IRCC 검색 결과 바로가기
                </a>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}