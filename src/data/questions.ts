export const QUESTIONS = [
  // 그룹 B: 자원 및 이용 형태
  {
    id: 4,
    text: "도입 자원이 생물자원 또는 그 파생물(추출물 등)에 해당합니까?",
    description: "생물자원뿐만 아니라 그로부터 유래된 추출물, 가루, 오일 등 '파생물'도 포함됩니다.",
    examples: ["베트남산 쌀", "브라질산 코파이바 오일", "인도산 커큐민 파우더"],
    category: "resource"
  },
  {
    id: 5,
    text: "자원 이용 목적이 연구개발(R&D)을 포함하고 있습니까?",
    description: "자원의 성분에 대해 분석, 합성, 개량 등의 행위를 하는지를 확인합니다.</BR> 완제품 생산을 위하여 원료를 단순 배합하는 것은 해당하지 않습니다",
    examples: ["효능 검증", "신규 화합물 탐색", "품종 개량"],
    category: "resource"
  },
  {
    id: 8,
    text: "현지 원주민의 전통지식을 활용합니까?",
    description: "해당 자원을 오랜 기간 이용해 온 현지인들의 특별한 노하우나 처방 정보를 활용하는 경우입니다.",
    examples: ["인도네시아의 자무음료와 같이 현지 부족의 민간 요법 활용 기록 등"],
    category: "resource"
  },
  {
    id: 10,
    text: "단순히 원물을 유통/재판매만 하십니까?",
    description: "제품의 성분을 바꾸거나 연구하지 않고, 원료를 들여와 그대로 판매하는 경우입니다.",
    examples: ["해외산 원료 소분 판매 등"],
    category: "resource",
    isReverse: true
  },
  // 그룹 C: 절차 준수 상태
  {
    id: 11,
    text: "제공국으로부터 사전통보승인(PIC)을 받으셨습니까?",
    description: "자원에 접근하기 전, 해당 국가 정부 기관으로부터 얻은 공식 허가입니다.",
    examples: ["제공국 국가책임기관(CNA) 발행 승인서"],
    category: "procedure"
  },
  {
    id: 12,
    text: "상호합의조건(MAT) 계약을 체결했습니까?",
    description: "자원 이용 이익을 어떻게 나눌지 자원 제공자와 맺은 민사 계약입니다.",
    examples: ["로열티 배분, 기술 이전 조항이 담긴 계약서"],
    category: "procedure"
  },
  {
    id: 15,
    text: "국내 유전자원정보관리센터에 절차준수 신고를 마쳤습니까?",
    description: "해외 자원을 적법하게 도입했다는 증빙을 갖추어 한국 정부에 신고하는 단계입니다.",
    examples: ["통합신고시스템(www.abs.go.kr) 신고 완료"],
    category: "procedure"
  }
];