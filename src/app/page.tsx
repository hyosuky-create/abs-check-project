"use client";

import { useState } from 'react';
import { countryDB } from '@/data/country'; // 앞서 옮기신 파일
import { QUESTIONS } from '@/data/questions';
import { Search, ChevronRight, CheckCircle, Info, ExternalLink, Users } from 'lucide-react';

export default function AbsDiagnosticTool() {
  const [step, setStep] = useState(0); // 0: 국가선택, 1: 설문, 2: 결과
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  // 1. 국가 검색 필터링
  const filteredCountries = countryDB.filter(c => 
    c.nameKo.includes(searchTerm) || c.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  // 2. 결과 판별 로직 (완곡한 표현 적용)
  const getResult = () => {
    if (!selectedCountry) return null;
    const isNagoya = selectedCountry.nagoya;
    const hasLaw = selectedCountry.absLaw;
    const isRnD = answers[5] && !answers[10];
    const hasPicMat = answers[11] && answers[12];

    if (answers[10] || (!isNagoya && !hasLaw)) {
      return {
        type: 'NONE',
        title: '자료 관리 및 향후 대비 안내',
        desc: '현재 조건에서는 나고야의정서 의무 대상이 아닐 가능성이 높습니다.',
        color: 'bg-slate-500',
        guidelines: [
          "향후 참고를 위해 이번 자가진단 결과와 자원 입수 서류를 잘 보관해 두시면 실무에 도움이 됩니다.",
          "만약 나중에 해당 자원을 직접 연구하거나 성분을 개량하게 된다면 진단을 다시 받아보시길 권합니다."
        ]
      };
    }

    if (isNagoya && hasLaw && isRnD && !hasPicMat) {
      return {
        type: 'HIGH',
        title: '절차 이행 및 리스크 점검 권고',
        desc: '당사국 비즈니스의 안전을 위해 제공국 법령 준수 여부를 확인해 보세요.',
        color: 'bg-[#004098]',
        guidelines: [
          "현재 이용 중인 자원의 도입 경로와 제공국 법령 준수 여부를 내부적으로 한 번 더 살펴봐 주세요.",
          "제공국 정부로부터 사전통보승인(PIC) 등 필요한 권한을 확보하는 과정이 사업 안정성에 도움이 될 수 있습니다.",
          "절차 진행이 복잡하게 느껴지신다면, 지원센터의 컨설팅을 통해 안전한 이행 방안을 함께 찾으실 수 있습니다."
        ]
      };
    }

    return {
      type: 'CAUTION',
      title: '지속적인 모니터링 및 사전 예방 권고',
      desc: '안전한 자원 활용을 위해 주기적인 확인과 준비가 필요한 단계입니다.',
      color: 'bg-[#52A55D]',
      guidelines: [
        `제공국의 법령이 마련 중이거나 확인이 필요한 상태입니다. 주기적인 규정 확인이 필요합니다.`,
        "원료 공급사와의 소통을 통해 ABS 관련 의무 사항이 잘 반영되어 있는지 체크해 보시는 것이 좋습니다.",
        "모호한 부분이 있다면 언제든 Help desk를 통해 사전 상담을 받아보시길 권장합니다."
      ]
    };
  };

  const result = getResult();

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans">
      {/* Header */}
      <header className="bg-white border-b-4 border-[#004098] p-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-[#004098] font-bold text-2xl">해외 유전자원 나고야의정서 자가진단</h1>
          <p className="text-sm text-gray-500 hidden md:block text-right">산업통상자원부 · 한국바이오협회<br/>나고야의정서 산업지원센터</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-10 px-4">
        {/* Step 0: 국가 선택 */}
        {step === 0 && (
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="bg-[#004098] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
              자원 제공 국가를 선택해 주세요.
            </h2>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-4 text-gray-400" size={20} />
              <input 
                type="text"
                placeholder="국가명(한글 또는 영문)을 입력하세요"
                className="w-full p-4 pl-12 border-2 border-gray-100 rounded-lg focus:border-[#004098] outline-none transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute w-full mt-2 bg-white border rounded-lg shadow-xl z-10">
                  {filteredCountries.map((c) => (
                    <div 
                      key={c.nameEn}
                      onClick={() => { setSelectedCountry(c); setSearchTerm(''); }}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                    >
                      {c.nameKo} ({c.nameEn})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedCountry && (
              <div className="bg-blue-50 p-6 rounded-lg mb-8 border border-blue-100 animate-in fade-in">
                <p className="font-bold text-[#004098] text-lg mb-2">선택된 국가: {selectedCountry.nameKo}</p>
                <div className="flex gap-3 text-sm">
                  <span className="bg-white px-3 py-1 rounded border">당사국: {selectedCountry.nagoya ? '예' : '아니오'}</span>
                  <span className="bg-white px-3 py-1 rounded border">법령보유: {selectedCountry.absLaw ? '예' : '아니오'}</span>
                  <span className="bg-white px-3 py-1 rounded border">상태: {selectedCountry.status}</span>
                </div>
              </div>
            )}

            <button 
              disabled={!selectedCountry}
              onClick={() => setStep(1)}
              className="w-full bg-[#004098] text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 disabled:bg-gray-300 transition-all"
            >
              다음 단계로 이동 <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 1: 자원 확인 설문 */}
        {step === 1 && (
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
              <span className="bg-[#004098] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
              해당하는 항목에 체크해 주세요.
            </h2>
            <div className="space-y-10">
              {QUESTIONS.map((q) => (
                <div key={q.id} className="border-b pb-8 last:border-0">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <h3 className="text-lg font-medium text-gray-800">{q.text}</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setAnswers({...answers, [q.id]: true})}
                        className={`px-6 py-2 rounded-lg border-2 transition-all ${answers[q.id] === true ? 'bg-[#004098] text-white border-[#004098]' : 'hover:bg-gray-50 border-gray-100'}`}
                      >예</button>
                      <button 
                        onClick={() => setAnswers({...answers, [q.id]: false})}
                        className={`px-6 py-2 rounded-lg border-2 transition-all ${answers[q.id] === false ? 'bg-gray-500 text-white border-gray-500' : 'hover:bg-gray-50 border-gray-100'}`}
                      >아니오</button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                    <p className="flex items-center gap-1 mb-1 font-semibold text-[#004098]"><Info size={14}/> 상세 설명</p>
                    <p className="mb-2 leading-relaxed">{q.description}</p>
                    <p className="text-xs text-gray-400">예시: {q.examples.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full mt-10 bg-[#004098] text-white py-4 rounded-lg font-bold shadow-lg"
            >
              진단 결과 확인하기
            </button>
          </div>
        )}

        {/* Step 2: 결과 리포트 */}
        {step === 2 && result && (
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className={`p-10 text-white ${result.color}`}>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle size={40} />
                <h2 className="text-3xl font-bold">{result.title}</h2>
              </div>
              <p className="text-xl opacity-90">{result.desc}</p>
            </div>

            <div className="p-10">
              <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2 border-b pb-3">
                <Info className="text-[#004098]" /> 안전한 자원 활용을 위한 가이드라인
              </h3>
              <ul className="space-y-6 mb-12">
                {result.guidelines.map((guide, idx) => (
                  <li key={idx} className="flex gap-4 items-start">
                    <span className="bg-gray-100 text-[#004098] rounded-full w-7 h-7 flex-shrink-0 flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                    <p className="text-gray-700 leading-relaxed pt-0.5">{guide}</p>
                  </li>
                ))}
              </ul>

              <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="text-[#004098]" size={24} />
                  <h4 className="text-xl font-bold text-gray-800">도움이 필요하신가요?</h4>
                </div>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  나고야의정서는 복잡해 보이지만, 전문가와 함께라면 차근차근 해결할 수 있습니다. 
                  모든 상담 내용은 기업의 비즈니스 안전을 위해 철저히 보호됩니다.
                </p>
                <a 
                  href="https://www.biosafety.or.kr/abs/default.do" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#004098] text-white py-4 px-8 rounded-lg font-bold hover:bg-opacity-90 transition-all w-full md:w-auto"
                >
                  <ExternalLink size={20} />
                  Help desk 상담요청 바로가기
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}