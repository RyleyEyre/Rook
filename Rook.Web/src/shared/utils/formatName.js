// Generic formatting helper, not tied to the employees mock data specifically
// (any record shaped like { firstName, middleName?, lastName } works) — the
// kind of thing that goes in shared/utils/ because unrelated modules would
// all want the exact same behavior, not their own copy.
export function fullName(person) {
  return [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ')
}
