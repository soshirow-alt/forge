import {
  bucketPercent,
  type VoicePromptAggregate,
} from "@/lib/voice-aggregates";

/**
 * Rule-based interpretation for developers (pre-AI).
 * Goal: 数字 → 解釈 → 改善示唆
 */
export function interpretVoiceAggregate(
  aggregate: VoicePromptAggregate,
): string[] {
  if (aggregate.totalResponses === 0) {
    return ["この版ではまだ返事が届いていません。"];
  }

  const lines: string[] = [];
  const sorted = [...aggregate.buckets].sort((a, b) => b.count - a.count);
  const top = sorted[0];
  const second = sorted[1];
  const topPct = bucketPercent(top.count, aggregate.totalResponses);

  switch (aggregate.responseKind) {
    case "yes_no": {
      const yes = sorted.find((b) => b.answerValue === "yes");
      const no = sorted.find((b) => b.answerValue === "no");
      const yesPct = yes ? bucketPercent(yes.count, aggregate.totalResponses) : 0;
      const noPct = no ? bucketPercent(no.count, aggregate.totalResponses) : 0;
      if (yesPct >= 70) {
        lines.push(
          `「${aggregate.promptText}」は概ね肯定的（はい ${yesPct}%）。`,
        );
      } else if (noPct >= 40) {
        lines.push(
          `「${aggregate.promptText}」で約 ${noPct}% が否定的。改善候補として確認する価値があります。`,
        );
      } else {
        lines.push(
          `「${aggregate.promptText}」は賛否が混在（はい ${yesPct}% / いいえ ${noPct}%）。`,
        );
      }
      break;
    }
    case "replay_intent": {
      const yes = sorted.find((b) => b.answerValue === "yes");
      const maybe = sorted.find((b) => b.answerValue === "maybe");
      const yesPct = yes ? bucketPercent(yes.count, aggregate.totalResponses) : 0;
      const maybePct = maybe
        ? bucketPercent(maybe.count, aggregate.totalResponses)
        : 0;
      if (yesPct + maybePct >= 60) {
        lines.push(
          `継続プレイ意向は高め（もう一度 ${yesPct}% + 更新次第 ${maybePct}%）。`,
        );
      } else {
        lines.push(
          `継続意向は控えめ。次版で「戻る理由」を作る改善が有効かもしれません。`,
        );
      }
      break;
    }
    case "choice": {
      lines.push(
        `「${top.answerLabel}」が最多（${topPct}%）。`,
      );
      if (second && second.count > 0) {
        const secondPct = bucketPercent(second.count, aggregate.totalResponses);
        if (secondPct >= 25) {
          lines.push(
            `ただし「${second.answerLabel}」派も ${secondPct}% 存在。両方の体験を捨てない判断が必要です。`,
          );
        }
      }
      break;
    }
    case "scale_3": {
      lines.push(
        `「${aggregate.promptText}」の中心は「${top.answerLabel}」（${topPct}%）。`,
      );
      break;
    }
    case "short_text": {
      lines.push(
        `自由記述への返事が ${aggregate.totalResponses} 件。個別内容は開発者のみ確認できます。`,
      );
      break;
    }
    default:
      lines.push(`返事 ${aggregate.totalResponses} 件。`);
  }

  return lines;
}
