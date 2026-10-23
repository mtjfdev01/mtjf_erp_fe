import React, { useMemo } from 'react';
import {
  AID_FAMILY_HEAD_TYPES,
  AID_RELATED_PERSON_TYPES,
  calcAgeFromDob,
  formatMaritalStatus,
} from '../aidConstants';
import { useAidLang } from '../lang/AidLangContext';

const relLabel = (type) =>
  AID_RELATED_PERSON_TYPES.find((t) => t.value === type)?.label ||
  AID_FAMILY_HEAD_TYPES.find((t) => t.value === type)?.label ||
  type ||
  'Relative';

const shortRel = (type) => {
  const map = {
    father: 'Father',
    mother: 'Mother',
    spouse: 'Spouse',
    husband: 'Husband',
    wife: 'Wife',
    son: 'Son',
    daughter: 'Daughter',
    child: 'Child',
    brother: 'Brother',
    sister: 'Sister',
    sibling: 'Sibling',
    step_brother: 'Brother',
    step_sister: 'Sister',
    half_brother: 'Brother',
    half_sister: 'Sister',
    grandfather: 'Grandfather',
    grandmother: 'Grandmother',
    maternal_grandfather: 'Grandfather',
    maternal_grandmother: 'Grandmother',
    father_in_law: 'Father-in-law',
    mother_in_law: 'Mother-in-law',
    uncle: 'Uncle',
    aunt: 'Aunt',
    cousin: 'Cousin',
    grandchild: 'Grandchild',
    guardian: 'Guardian',
    other: 'Relative',
  };
  return map[String(type || '').toLowerCase()] || relLabel(type);
};

const relationOf = (p) =>
  String(
    p?._relation_type ||
      p?.relation_type ||
      p?.relation_with_family_head ||
      p?.relation_with_beneficiary ||
      '',
  ).toLowerCase();

const isLate = (p) => p && p.is_alive === false;
const isGuarded = (p) =>
  !!p?.under_guardianship ||
  p?.household_dependency === 'dependent_on_family_head' ||
  /guardianship|dependent under (family head|guardian)/i.test(
    String(p?._notes || p?.notes || ''),
  );

const notesSayFamilyHead = (notes) =>
  /family\s*head/i.test(String(notes || ''));

const samePerson = (a, b) => {
  if (!a || !b) return false;
  if (a.id != null && b.id != null && Number(a.id) === Number(b.id)) {
    return true;
  }
  const cnicA = String(a.cnic || '').replace(/\D/g, '');
  const cnicB = String(b.cnic || '').replace(/\D/g, '');
  if (cnicA && cnicB && cnicA === cnicB) return true;
  const nameA = String(a.full_name || '').trim().toLowerCase();
  const nameB = String(b.full_name || '').trim().toLowerCase();
  return !!(nameA && nameB && nameA === nameB);
};

/** Map /aid/people/:id family_tree rows → person with relation. */
const fromApiRows = (rows = [], prefix = 'api') =>
  (rows || [])
    .map((row, i) => {
      const person = row?.person || row;
      if (!person?.id && !person?.full_name) return null;
      return {
        ...person,
        relation_type: row?.relation_type || person.relation_type || '',
        _notes: row?.notes || '',
        under_guardianship: /guardianship|dependent under/i.test(
          String(row?.notes || ''),
        ),
        _tree_id: `${prefix}-${person.id || i}`,
      };
    })
    .filter(Boolean);

const nodeMeta = (person, roleHint, copy) => {
  if (!person) return null;
  const age = calcAgeFromDob(person.date_of_birth);
  const role = roleHint || shortRel(relationOf(person));
  const lateLabel = copy?.late ?? 'late';
  const lines = [];
  if (person.is_family_head) {
    lines.push(copy?.familyHeadBadge ?? 'FAMILY HEAD');
  } else if (person.is_beneficiary) {
    lines.push(copy?.beneficiaryBadge ?? 'BENEFICIARY');
    const bits = [role];
    if (isLate(person)) bits.push(lateLabel);
    else if (age != null) bits.push(String(age));
    if (bits.filter(Boolean).length) {
      lines.push(bits.filter(Boolean).join(' - '));
    }
  } else {
    const bits = [role];
    if (isLate(person)) bits.push(lateLabel);
    else if (age != null) bits.push(String(age));
    lines.push(bits.filter(Boolean).join(' - '));
  }
  if (person.is_family_head) {
    const ms = person.marital_status
      ? formatMaritalStatus(person.marital_status)
      : '';
    const ageBit = age != null ? String(age) : '';
    if (person.date_of_birth) {
      lines.push(`DOB ${String(person.date_of_birth).slice(0, 10)}`);
    }
    if (ms || ageBit) {
      lines.push([ms, ageBit].filter(Boolean).join(' - '));
    }
  }
  if (!person.is_family_head && isGuarded(person)) {
    lines.push('Guardianship');
  } else if (
    !person.is_family_head &&
    !person.is_beneficiary &&
    person.occupation?.trim()
  ) {
    lines.push('Earning');
  } else if (
    !person.is_family_head &&
    !person.is_beneficiary &&
    !isLate(person) &&
    (person.city || person.district || person.address)
  ) {
    lines.push('In household');
  }
  if (person.education_level === 'primary' || person.student_class) {
    if (!lines.includes('Earning') && !lines.includes('Guardianship')) {
      lines.push('Education');
    }
  }
  return {
    id: person._tree_id,
    name: person.full_name?.trim() || (copy?.unnamed ?? 'Unnamed'),
    lines,
    variant: person.is_family_head
      ? 'head'
      : isLate(person)
        ? 'late'
        : isGuarded(person)
          ? 'guardian'
          : 'alive',
    highlight: !!person._highlight,
  };
};

const TreeNode = ({ node, onSelect }) => {
  if (!node) {
    return <div className="aid-ft-node aid-ft-node--empty" aria-hidden />;
  }
  return (
    <button
      type="button"
      className={`aid-ft-node aid-ft-node--${node.variant}${
        node.highlight ? ' is-highlight' : ''
      }`}
      onClick={() => onSelect?.(node)}
    >
      <strong className="aid-ft-node__name">{node.name}</strong>
      {node.lines.map((line, i) => (
        <span key={`${node.id}-${i}`} className="aid-ft-node__line">
          {line.startsWith('Education') || line.includes('benefit') ? (
            <>
              <i className="aid-ft-node__dot" aria-hidden />
              {line}
            </>
          ) : (
            line
          )}
        </span>
      ))}
    </button>
  );
};

const CoupleRow = ({ left, right, onSelect }) => (
  <div className="aid-ft-couple">
    <TreeNode node={left} onSelect={onSelect} />
    {(left || right) && <span className="aid-ft-couple__bar" aria-hidden />}
    <TreeNode node={right} onSelect={onSelect} />
  </div>
);

const SiblingRow = ({ nodes, onSelect }) => {
  if (!nodes.length) return null;
  return (
    <div className="aid-ft-siblings">
      {nodes.length > 1 ? (
        <div className="aid-ft-siblings__rail" aria-hidden />
      ) : null}
      <div className="aid-ft-siblings__nodes">
        {nodes.map((n) => (
          <div key={n.id} className="aid-ft-siblings__item">
            <span className="aid-ft-siblings__stem" aria-hidden />
            <TreeNode node={n} onSelect={onSelect} />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Visual family tree — intake form props and/or API family_tree from /aid/people/:id.
 */
const AidFamilyTreePanel = ({
  familyHeads = [],
  spouse = null,
  beneficiaryMembers = [],
  beneficiary = null,
  headAsBeneficiary = null,
  /** Saved kinship tree from people detail API */
  apiTree = null,
  rootPerson = null,
  /** Applicant / writer when they are the registered Family Head (not self) */
  familyHeadHint = null,
  familyHeadRelation = '',
  emptyHint,
  showHeader = true,
  selectedId = null,
  onSelectNode,
}) => {
  const { t } = useAidLang();
  const treeCopy = useMemo(
    () => ({
      familyHeadBadge: t('familyHeadBadge'),
      beneficiaryBadge: t('beneficiaryBadge'),
      unnamed: t('unnamed'),
      late: t('late'),
    }),
    [t],
  );
  const resolvedEmptyHint = emptyHint ?? t('familyTreeEmpty');

  const model = useMemo(() => {
    const mark = (p, role) =>
      p
        ? nodeMeta(
            {
              ...p,
              _highlight: selectedId === p._tree_id || !!p._highlight,
            },
            role,
            treeCopy,
          )
        : null;

    // ——— API mode (entry / case review) ———
    // rootPerson = beneficiary (ego). Family Head may be a parent / writer.
    if (rootPerson != null || apiTree != null) {
      const tree = apiTree || {};
      const parents = fromApiRows(tree.parents, 'par');
      const grandparents = fromApiRows(tree.grandparents, 'gp');
      const extended = fromApiRows(tree.extended, 'ext');
      const spouseRows = fromApiRows(tree.spouse, 'sp');
      const siblings = [
        ...fromApiRows(tree.brothers, 'br'),
        ...fromApiRows(tree.sisters, 'sis'),
        ...fromApiRows(tree.siblings, 'sib'),
      ];
      let children = [
        ...fromApiRows(tree.children, 'ch'),
        ...fromApiRows(tree.grandchildren, 'gc'),
      ];
      const extendedGuarded = extended.filter((p) => isGuarded(p));

      const beneficiarySrc = rootPerson || beneficiary;
      const noteHead =
        [...parents, ...grandparents, ...extended, ...spouseRows, ...siblings, ...children].find(
          (p) => notesSayFamilyHead(p._notes),
        ) || null;

      let resolvedHead = noteHead;
      if (
        !resolvedHead &&
        familyHeadHint?.full_name &&
        !samePerson(familyHeadHint, beneficiarySrc)
      ) {
        resolvedHead = {
          ...familyHeadHint,
          relation_type:
            familyHeadRelation || familyHeadHint.relation_type || '',
          _notes: 'Family head',
          _tree_id: `hint-${familyHeadHint.id || 'head'}`,
        };
      }

      const beneficiaryIsHead =
        !resolvedHead || samePerson(resolvedHead, beneficiarySrc);

      const headPerson = beneficiaryIsHead
        ? beneficiarySrc
          ? {
              ...beneficiarySrc,
              is_family_head: true,
              is_beneficiary: true,
              _tree_id: `root-${beneficiarySrc.id || 'head'}`,
            }
          : null
        : {
            ...resolvedHead,
            is_family_head: true,
            _tree_id: resolvedHead._tree_id || `head-${resolvedHead.id}`,
          };

      let father =
        parents.find((p) => relationOf(p) === 'father') ||
        grandparents.find((p) =>
          ['father', 'grandfather'].includes(relationOf(p)),
        ) ||
        null;
      let mother =
        parents.find((p) => relationOf(p) === 'mother') ||
        grandparents.find((p) =>
          ['mother', 'grandmother'].includes(relationOf(p)),
        ) ||
        null;

      // Family head sits in the mid “head” slot — don’t also show them as a parent.
      if (headPerson && !beneficiaryIsHead) {
        if (samePerson(father, headPerson)) father = null;
        if (samePerson(mother, headPerson)) mother = null;
      }

      const fil =
        grandparents.find((p) =>
          ['maternal_grandfather', 'father_in_law'].includes(relationOf(p)),
        ) ||
        extended.find((p) => relationOf(p) === 'father_in_law') ||
        null;
      const mil =
        grandparents.find((p) =>
          ['maternal_grandmother', 'mother_in_law'].includes(relationOf(p)),
        ) ||
        extended.find((p) => relationOf(p) === 'mother_in_law') ||
        null;

      const spousePerson = spouseRows[0] || null;

      if (
        !beneficiaryIsHead &&
        beneficiarySrc?.full_name &&
        !children.some((c) => samePerson(c, beneficiarySrc)) &&
        !siblings.some((s) => samePerson(s, beneficiarySrc))
      ) {
        children = [
          {
            ...beneficiarySrc,
            relation_type: beneficiarySrc.gender === 'female' ? 'daughter' : 'son',
            is_beneficiary: true,
            _tree_id: `ben-${beneficiarySrc.id || 'ego'}`,
          },
          ...children,
        ];
      }

      return {
        paternal: {
          father: mark(father, shortRel(relationOf(father) || 'father')),
          mother: mark(mother, shortRel(relationOf(mother) || 'mother')),
        },
        inlaws: {
          father: mark(fil, 'Father-in-law'),
          mother: mark(mil, 'Mother-in-law'),
        },
        siblings: [...siblings, ...extendedGuarded]
          .filter((s) => !samePerson(s, headPerson))
          .map((s) => mark(s, shortRel(relationOf(s)))),
        head: mark(headPerson, 'FAMILY HEAD'),
        spouse: mark(
          spousePerson && !samePerson(spousePerson, headPerson)
            ? spousePerson
            : null,
          headPerson?.gender === 'female' ? 'Husband' : 'Wife',
        ),
        children: children
          .filter((c) => !samePerson(c, headPerson))
          .map((c) =>
            mark(
              c,
              c.is_beneficiary
                ? 'Beneficiary'
                : shortRel(relationOf(c)),
            ),
          ),
        hasAny: !!(
          headPerson ||
          father ||
          mother ||
          spousePerson ||
          siblings.length ||
          children.length ||
          fil ||
          mil
        ),
      };
    }

    // ——— Intake form mode ———
    // Family Head = first named Family Head row (not the beneficiary by default).
    const namedHeads = (familyHeads || []).filter((h) =>
      String(h?.full_name || '').trim(),
    );
    const primaryHead = namedHeads[0] || null;
    const beneficiaryPerson =
      headAsBeneficiary ||
      (beneficiary?.full_name ? beneficiary : null);
    const beneficiaryIsHead =
      !!primaryHead?.is_beneficiary ||
      samePerson(primaryHead, headAsBeneficiary) ||
      (!primaryHead && !!beneficiaryPerson);

    const headPerson = primaryHead
      ? {
          ...primaryHead,
          is_family_head: true,
          is_beneficiary: !!primaryHead.is_beneficiary,
          _tree_id: 'head-0',
          _highlight: selectedId === 'head-0',
        }
      : beneficiaryPerson
        ? {
            ...beneficiaryPerson,
            is_family_head: true,
            is_beneficiary: true,
            _tree_id: 'beneficiary',
            _highlight: selectedId === 'beneficiary',
          }
        : null;

    const memberPool = [];
    familyHeads.forEach((h, hi) => {
      if (h !== primaryHead && h?.full_name?.trim()) {
        memberPool.push({
          ...h,
          _tree_id: `fh-${hi}`,
          relation_type: h._relation_type || relationOf(h),
        });
      }
      (h._family_members || []).forEach((m, mi) => {
        if (m?.full_name?.trim()) {
          memberPool.push({
            ...m,
            _tree_id: `hm-${hi}-${mi}`,
          });
        }
      });
    });
    (beneficiaryMembers || []).forEach((m, mi) => {
      if (m?.full_name?.trim()) {
        memberPool.push({ ...m, _tree_id: `bm-${mi}` });
      }
    });
    if (
      !beneficiaryIsHead &&
      beneficiaryPerson?.full_name &&
      !samePerson(beneficiaryPerson, primaryHead)
    ) {
      memberPool.push({
        ...beneficiaryPerson,
        relation_type:
          beneficiaryPerson.gender === 'female' ? 'daughter' : 'son',
        is_beneficiary: true,
        _tree_id: 'beneficiary-ego',
      });
    }

    const take = (pred) => {
      const hit = memberPool.find(pred);
      return hit || null;
    };
    const takeAll = (pred) => memberPool.filter(pred);

    let father = take((p) => relationOf(p) === 'father');
    let mother = take((p) => relationOf(p) === 'mother');
    if (headPerson && relationOf(primaryHead) === 'father') father = null;
    if (headPerson && relationOf(primaryHead) === 'mother') mother = null;

    const fil = take(
      (p) =>
        relationOf(p) === 'father_in_law' ||
        (relationOf(p) === 'father' && p !== father),
    );
    const mil = take(
      (p) =>
        relationOf(p) === 'mother_in_law' ||
        (relationOf(p) === 'mother' && p !== mother),
    );

    const spousePerson =
      spouse?.full_name?.trim()
        ? {
            ...spouse,
            _tree_id: 'spouse',
            relation_type:
              headPerson?.gender === 'female' ? 'husband' : 'wife',
          }
        : take((p) => ['spouse', 'husband', 'wife'].includes(relationOf(p)));

    const siblings = takeAll((p) =>
      [
        'brother',
        'sister',
        'sibling',
        'step_brother',
        'step_sister',
        'half_brother',
        'half_sister',
      ].includes(relationOf(p)),
    );

    const children = takeAll(
      (p) =>
        ['son', 'daughter', 'child', 'grandchild'].includes(relationOf(p)) ||
        !!p.is_beneficiary,
    );

    return {
      paternal: {
        father: mark(father, 'Father'),
        mother: mark(mother, 'Mother'),
      },
      inlaws: {
        father: mark(fil, 'Father-in-law'),
        mother: mark(mil, 'Mother-in-law'),
      },
      siblings: siblings.map((s) => mark(s)),
      head: mark(headPerson, 'FAMILY HEAD'),
      spouse: mark(
        spousePerson,
        headPerson?.gender === 'female' ? 'Husband' : 'Wife',
      ),
      children: children.map((c) =>
        mark(c, c.is_beneficiary ? 'Beneficiary' : shortRel(relationOf(c))),
      ),
      hasAny: !!(
        headPerson ||
        father ||
        mother ||
        spousePerson ||
        siblings.length ||
        children.length
      ),
    };
  }, [
    apiTree,
    rootPerson,
    familyHeads,
    spouse,
    beneficiaryMembers,
    beneficiary,
    headAsBeneficiary,
    familyHeadHint,
    familyHeadRelation,
    selectedId,
    treeCopy,
  ]);

  if (!model.hasAny) {
    return (
      <div className="aid-ft aid-ft--empty">
        <p>{resolvedEmptyHint}</p>
      </div>
    );
  }

  const hasPaternal = model.paternal.father || model.paternal.mother;
  const hasInlaws = model.inlaws.father || model.inlaws.mother;
  const midRow = [
    ...model.siblings.filter(Boolean),
    model.head,
    model.spouse,
  ].filter(Boolean);

  return (
    <div className="aid-ft">
      {showHeader ? (
        <header className="aid-ft__header">
          <h3 className="form-section-heading" style={{ margin: 0 }}>
            {t('familyTree')}
          </h3>
          <p className="aid-section-hint" style={{ margin: '0.35rem 0 0' }}>
            {t('familyTreeHintLong')}
          </p>
        </header>
      ) : null}

      <div className="aid-ft__canvas">
        {(hasPaternal || hasInlaws) && (
          <div className="aid-ft__gen aid-ft__gen--top">
            {hasPaternal ? (
              <div className="aid-ft__branch">
                <CoupleRow
                  left={model.paternal.father}
                  right={model.paternal.mother}
                  onSelect={onSelectNode}
                />
                <span className="aid-ft__drop" aria-hidden />
              </div>
            ) : (
              <div className="aid-ft__branch aid-ft__branch--spacer" />
            )}
            {hasInlaws ? (
              <div className="aid-ft__branch">
                <CoupleRow
                  left={model.inlaws.father}
                  right={model.inlaws.mother}
                  onSelect={onSelectNode}
                />
                <span className="aid-ft__drop" aria-hidden />
              </div>
            ) : (
              <div className="aid-ft__branch aid-ft__branch--spacer" />
            )}
          </div>
        )}

        <div className="aid-ft__gen aid-ft__gen--mid">
          {(hasPaternal || hasInlaws) && midRow.length > 1 ? (
            <div className="aid-ft__mid-rail" aria-hidden />
          ) : null}
          <div className="aid-ft__mid-row">
            {model.siblings.map((n) => (
              <div key={n.id} className="aid-ft__mid-item">
                <span className="aid-ft__mid-stem" aria-hidden />
                <TreeNode node={n} onSelect={onSelectNode} />
              </div>
            ))}
            {model.head ? (
              <div className="aid-ft__mid-item aid-ft__mid-item--head">
                <span className="aid-ft__mid-stem" aria-hidden />
                <div className="aid-ft-couple aid-ft-couple--head">
                  <TreeNode node={model.head} onSelect={onSelectNode} />
                  {model.spouse ? (
                    <>
                      <span className="aid-ft-couple__bar" aria-hidden />
                      <TreeNode node={model.spouse} onSelect={onSelectNode} />
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {model.children.length ? (
          <div className="aid-ft__gen aid-ft__gen--kids">
            <span className="aid-ft__drop aid-ft__drop--kids" aria-hidden />
            <SiblingRow nodes={model.children} onSelect={onSelectNode} />
          </div>
        ) : null}
      </div>

      <div className="aid-ft__legend">
        <span>
          <i className="aid-ft-swatch aid-ft-swatch--head" /> Family head
        </span>
        <span>
          <i className="aid-ft-swatch aid-ft-swatch--alive" /> In household
        </span>
        <span>
          <i className="aid-ft-swatch aid-ft-swatch--late" /> Late
        </span>
        <span>
          <i className="aid-ft-swatch aid-ft-swatch--guardian" /> Guardianship
        </span>
      </div>
    </div>
  );
};

export default AidFamilyTreePanel;
